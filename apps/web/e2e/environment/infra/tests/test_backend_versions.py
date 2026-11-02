import json
import subprocess
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from unittest.mock import Mock, patch

from scripts.backend_versions import (
    SERVICES, USER_AGENT, Image, inspect_image, read_json, resolve_images, resolve_service,
)

CGW = SERVICES["CGW_IMAGE"]
TXS = SERVICES["TXS_IMAGE"]
QUEUE = SERVICES["QUEUE_IMAGE"]
EVENTS = SERVICES["EVENTS_IMAGE"]
DIGEST = "sha256:" + "a" * 64
COMMIT = "6e0e964a7612a5a6708418262c5a518a9b6f27c4"
DEPLOYMENTS = "https://api.github.com/repos/safe-global/safe-events-service/deployments"


def inspected(build_commit=COMMIT):
    return Mock(return_value=Image(DIGEST, build_commit))


def github(environment, *deployments):
    """Answers the newest-first deployments of `environment`, given as (deployment, newest status) pairs."""
    answers = {f"{DEPLOYMENTS}?environment={environment}&per_page=10": [deployment for deployment, _ in deployments]}
    for deployment, state in deployments:
        answers[f"{DEPLOYMENTS}/{deployment['id']}/statuses?per_page=1"] = [{"state": state}] if state else []
    return Mock(side_effect=answers.__getitem__)


class AboutServer:
    """Serves one /about answer on localhost and records the request headers."""

    def __init__(self, status=200, body=b"{}"):
        self.headers = {}
        server = self

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                server.headers = dict(self.headers)
                self.send_response(status)
                self.end_headers()
                self.wfile.write(body)

            def log_message(self, *args):
                pass

        self.http = HTTPServer(("127.0.0.1", 0), Handler)
        self.url = f"http://127.0.0.1:{self.http.server_port}/about"
        threading.Thread(target=self.http.serve_forever, daemon=True).start()

    def close(self):
        self.http.shutdown()
        self.http.server_close()


class ResolveServiceTests(unittest.TestCase):
    def test_cgw_uses_the_deployed_version_as_its_tag(self):
        for backend, version in (("staging", "main-8c82b42"), ("production", "v1.129.0")):
            with self.subTest(backend=backend):
                inspect = inspected(None)
                read = Mock(return_value={"version": version})
                image, warning = resolve_service(CGW, backend, read, inspect)
                read.assert_called_once_with(CGW.about[backend])
                inspect.assert_called_once_with(f"{CGW.repository}:{version}")
                self.assertEqual(image, f"{CGW.repository}:{version}@{DIGEST}")
                self.assertIsNone(warning)

    def test_production_release_services_use_the_release_tag(self):
        inspect = inspected("af8164e")
        read = Mock(return_value={"version": "0.9.0", "buildCommit": "af8164e"})
        image, warning = resolve_service(QUEUE, "production", read, inspect)
        self.assertEqual(image, f"{QUEUE.repository}:v0.9.0@{DIGEST}")
        self.assertIsNone(warning)

    def test_staging_release_services_pin_the_staging_tag_by_digest(self):
        inspect = inspected()
        read = Mock(return_value={"version": "6.13.0", "build_commit": COMMIT})
        image, warning = resolve_service(TXS, "staging", read, inspect)
        inspect.assert_called_once_with(f"{TXS.repository}:staging")
        self.assertEqual(image, f"{TXS.repository}:staging@{DIGEST}")
        self.assertIsNone(warning)

    def test_staging_warns_when_the_staging_tag_holds_another_build(self):
        for build_commit, shown in (("d74988997375", "d749889"), (None, "unknown")):
            with self.subTest(build_commit=build_commit):
                read = Mock(return_value={"version": "6.13.0", "build_commit": COMMIT})
                image, warning = resolve_service(TXS, "staging", read, inspected(build_commit))
                self.assertEqual(image, f"{TXS.repository}:staging@{DIGEST}")
                self.assertIn("staging runs 6e0e964", warning)
                self.assertIn(f"`staging` image is {shown}", warning)

    def test_missing_fields_name_the_service_and_url(self):
        cases = (
            (CGW, "staging", {}, "`version`"),
            (CGW, "production", {"version": ""}, "`version`"),
            (QUEUE, "staging", {"version": "0.9.0"}, "`buildCommit`"),
        )
        for service, backend, about, missing in cases:
            with self.subTest(service=service.name, about=about):
                with self.assertRaisesRegex(RuntimeError, missing) as error:
                    resolve_service(service, backend, Mock(return_value=about), inspected())
                self.assertIn(service.name, str(error.exception))
                self.assertIn(service.about[backend], str(error.exception))


class ResolveDeployedServiceTests(unittest.TestCase):
    def test_staging_uses_the_main_build_of_the_newest_successful_devstaging_deployment(self):
        read = github(
            "devstaging",
            ({"id": 3, "ref": "main", "sha": "d74988997375"}, "failure"),
            ({"id": 2, "ref": "main", "sha": COMMIT}, "success"),
            ({"id": 1, "ref": "main", "sha": "af8164e00000"}, "success"),
        )
        inspect = inspected()
        image, warning = resolve_service(EVENTS, "staging", read, inspect)
        inspect.assert_called_once_with(f"{EVENTS.repository}:main-6e0e964")
        self.assertEqual(image, f"{EVENTS.repository}:main-6e0e964@{DIGEST}")
        self.assertIsNone(warning)
        self.assertEqual(read.call_count, 3)

    def test_production_uses_the_release_tag_of_the_deployment(self):
        read = github("production", ({"id": 1, "ref": "v1.8.0", "sha": COMMIT}, "success"))
        image, _ = resolve_service(EVENTS, "production", read, inspected())
        self.assertEqual(image, f"{EVENTS.repository}:v1.8.0@{DIGEST}")

    def test_production_refuses_a_deployment_without_a_release_tag(self):
        read = github("production", ({"id": 1, "ref": "main", "sha": COMMIT}, "success"))
        inspect = inspected()
        with self.assertRaisesRegex(RuntimeError, "Events Service.*'main', not a release tag"):
            resolve_service(EVENTS, "production", read, inspect)
        inspect.assert_not_called()

    def test_fails_when_no_recent_deployment_succeeded(self):
        read = github("devstaging", ({"id": 2, "sha": COMMIT}, "in_progress"), ({"id": 1, "sha": COMMIT}, None))
        with self.assertRaisesRegex(RuntimeError, "no successful devstaging deployment.*github.com/safe-global/"):
            resolve_service(EVENTS, "staging", read, inspected())


class ResolveImagesTests(unittest.TestCase):
    def test_resolves_every_service_that_is_not_exported(self):
        resolve = Mock(side_effect=lambda service, backend: (f"{service.repository}:x", None))
        images, warnings = resolve_images("production", {"CGW_IMAGE": "local/cgw:dev"}, resolve)
        self.assertEqual(set(images), set(SERVICES) - {"CGW_IMAGE"})
        self.assertEqual(warnings, [])
        self.assertTrue(all(call.args[1] == "production" for call in resolve.call_args_list))

    def test_collects_the_warnings_of_each_service(self):
        resolve = Mock(side_effect=lambda service, backend: ("image", f"{service.name} moved"))
        _, warnings = resolve_images("staging", {}, resolve)
        self.assertEqual(warnings, [f"{service.name} moved" for service in SERVICES.values()])

    def test_rejects_an_unknown_backend_before_any_request(self):
        resolve = Mock()
        with self.assertRaisesRegex(ValueError, "staging, production"):
            resolve_images("release", {}, resolve)
        resolve.assert_not_called()


class ReadJsonTests(unittest.TestCase):
    def serve(self, **kwargs):
        server = AboutServer(**kwargs)
        self.addCleanup(server.close)
        return server

    def test_sends_a_browser_user_agent_that_cloudfront_accepts(self):
        server = self.serve(body=json.dumps({"version": "v1.129.0"}).encode())
        self.assertEqual(read_json(server.url), {"version": "v1.129.0"})
        self.assertEqual(server.headers["User-Agent"], USER_AGENT)

    def test_sends_the_github_token_to_the_github_api_only(self):
        server = self.serve()
        token = {"GITHUB_TOKEN": "ghs_test"}
        read_json(server.url, token)
        self.assertNotIn("Authorization", server.headers)
        with patch("scripts.backend_versions.GITHUB_API", server.url.removesuffix("/about")):
            read_json(server.url, token)
        self.assertEqual(server.headers["Authorization"], "Bearer ghs_test")

    def test_http_errors_name_the_status(self):
        server = self.serve(status=403)
        with self.assertRaisesRegex(RuntimeError, f"{server.url} answered HTTP 403"):
            read_json(server.url)

    def test_invalid_json_and_unreachable_hosts_fail_with_the_url(self):
        server = self.serve(body=b"<html>")
        with self.assertRaisesRegex(RuntimeError, f"Cannot read {server.url}"):
            read_json(server.url)
        with self.assertRaisesRegex(RuntimeError, "Cannot read http://127.0.0.1:9/about"):
            read_json("http://127.0.0.1:9/about")


def docker_result(details, returncode=0, stderr=""):
    return subprocess.CompletedProcess([], returncode, json.dumps(details), stderr)


class InspectImageTests(unittest.TestCase):
    def config(self, *variables):
        return {"config": {"Env": ["PATH=/bin", *variables]}}

    def test_reads_the_digest_and_build_commit_of_a_multi_platform_image(self):
        details = {
            "manifest": {"digest": DIGEST},
            "image": {"linux/amd64": self.config(), "linux/arm64": self.config(f"BUILD_COMMIT={COMMIT}")},
        }
        with patch("scripts.backend_versions.subprocess.run", return_value=docker_result(details)) as docker:
            self.assertEqual(inspect_image("repo:staging"), Image(DIGEST, COMMIT))
        self.assertEqual(docker.call_args.args[0][:5], ["docker", "buildx", "imagetools", "inspect", "repo:staging"])

    def test_single_platform_images_without_a_build_commit(self):
        details = {"manifest": {"digest": DIGEST}, "image": self.config("APPLICATION_VERSION=v1.129.0")}
        with patch("scripts.backend_versions.subprocess.run", return_value=docker_result(details)):
            self.assertEqual(inspect_image("repo:v1.129.0"), Image(DIGEST, None))

    def test_registry_failures_explain_the_private_queue_image(self):
        failure = docker_result({}, returncode=1, stderr="ERROR: 401 Unauthorized\n")
        with patch("scripts.backend_versions.subprocess.run", return_value=failure):
            with self.assertRaisesRegex(RuntimeError, "401 Unauthorized.*docker login ghcr.io"):
                inspect_image("ghcr.io/safe-global/safe-queue-service:staging")


if __name__ == "__main__":
    unittest.main()
