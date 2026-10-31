"""Resolves the Safe service images of the isolated stack from the versions that staging or production runs."""
import json
import os
import socket
import subprocess
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Mapping, Optional


BACKENDS = ("staging", "production")
# CloudFront in front of the production APIs refuses short or non-browser user agents.
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
)


@dataclass(frozen=True)
class Service:
    name: str
    repository: str
    about: Mapping[str, str]
    # Set when `main` builds overwrite the `staging` tag; /about then reports the last release, not the build.
    commit_field: Optional[str] = None


SERVICES = {
    "CGW_IMAGE": Service("CGW", "ghcr.io/safe-global/safe-client-gateway", {
        "staging": "https://safe-client.staging.5afe.dev/about",
        "production": "https://safe-client.safe.global/about",
    }),
    "CFG_IMAGE": Service("Config Service", "ghcr.io/safe-global/safe-config-service", {
        "staging": "https://safe-config.staging.5afe.dev/api/v1/about/",
        "production": "https://safe-config.safe.global/api/v1/about/",
    }),
    "TXS_IMAGE": Service("Transaction Service", "ghcr.io/safe-global/safe-transaction-service", {
        "staging": "https://api.5afe.dev/tx-service/sep/api/v1/about/",
        "production": "https://api.safe.global/tx-service/sep/api/v1/about/",
    }, commit_field="build_commit"),
    "QUEUE_IMAGE": Service("Queue Service", "ghcr.io/safe-global/safe-queue-service", {
        "staging": "https://api.5afe.dev/queue/api/v1/about",
        "production": "https://api.safe.global/queue/api/v1/about",
    }, commit_field="buildCommit"),
    "DECODER_IMAGE": Service("Decoder", "ghcr.io/safe-global/safe-decoder-service", {
        "staging": "https://api.5afe.dev/decoder/api/v1/about",
        "production": "https://api.safe.global/decoder/api/v1/about",
    }, commit_field="buildCommit"),
}


@dataclass(frozen=True)
class Image:
    digest: str
    build_commit: Optional[str]


def read_about(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"{url} answered HTTP {exc.code}") from exc
    except (urllib.error.URLError, socket.timeout, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Cannot read {url}: {exc}") from exc


def inspect_image(reference):
    result = subprocess.run(
        ["docker", "buildx", "imagetools", "inspect", reference, "--format", "{{json .}}"],
        text=True, capture_output=True, timeout=120,
    )
    if result.returncode:
        detail = (result.stderr.strip().splitlines() or ["no output"])[-1]
        raise RuntimeError(
            f"Cannot inspect {reference}: {detail}. "
            "The Queue Service image is private: run `docker login ghcr.io` with read:packages."
        )
    details = json.loads(result.stdout)
    image = details["image"]
    if "config" not in image:
        # A multi-platform image maps each platform to its config; all platforms share the build commit.
        image = image.get("linux/arm64") or next(iter(image.values()))
    variables = dict(entry.partition("=")[::2] for entry in image["config"].get("Env") or [])
    return Image(details["manifest"]["digest"], variables.get("BUILD_COMMIT"))


def about_field(about, name, service, url):
    value = about.get(name)
    if not isinstance(value, str) or not value:
        raise RuntimeError(f"{service.name} /about at {url} has no `{name}` field")
    return value


def resolve_service(service, backend, read=read_about, inspect=inspect_image):
    """Returns the image reference pinned by digest, and a warning when staging runs an older build."""
    url = service.about[backend]
    about = read(url)
    version = about_field(about, "version", service, url)
    if service.commit_field is None:
        tag = version
    elif backend == "production":
        tag = f"v{version}"
    else:
        tag = "staging"
    reference = f"{service.repository}:{tag}"
    image = inspect(reference)
    warning = None
    if service.commit_field and backend == "staging":
        deployed = about_field(about, service.commit_field, service, url)
        if image.build_commit != deployed:
            warning = (
                f"{service.name}: staging runs {deployed[:7]}, but the `staging` image is "
                f"{(image.build_commit or 'unknown')[:7]}; the tests use the image"
            )
    return f"{reference}@{image.digest}", warning


def resolve_images(backend, environ=os.environ, resolve=resolve_service):
    """Resolves each service image that `environ` does not set, for the `staging` or `production` backend.

    Returns:
        The image reference of each resolved variable, and the warnings to show.
    """
    if backend not in BACKENDS:
        raise ValueError(f"Backend must be one of {', '.join(BACKENDS)}, not {backend!r}")
    images, warnings = {}, []
    for variable, service in SERVICES.items():
        if environ.get(variable):
            continue
        images[variable], warning = resolve(service, backend)
        if warning:
            warnings.append(warning)
    return images, warnings
