import json
import subprocess
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from unittest.mock import Mock, patch

from scripts.backend_versions import (
    SERVICES, USER_AGENT, Image, inspect_image, read_about, resolve_images, resolve_service,
)

CGW = SERVICES["CGW_IMAGE"]
TXS = SERVICES["TXS_IMAGE"]
QUEUE = SERVICES["QUEUE_IMAGE"]
DIGEST = "sha256:" + "a" * 64
COMMIT = "6e0e964a7612a5a6708418262c5a518a9b6f27c4"


def inspected(build_commit=COMMIT):
    return Mock(return_value=Image(DIGEST, build_commit))


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


class ReadAboutTests(unittest.TestCase):
    def serve(self, **kwargs):
        server = AboutServer(**kwargs)
        self.addCleanup(server.close)
        return server

    def test_sends_a_browser_user_agent_that_cloudfront_accepts(self):
        server = self.serve(body=json.dumps({"version": "v1.129.0"}).encode())
        self.assertEqual(read_about(server.url), {"version": "v1.129.0"})
        self.assertEqual(server.headers["User-Agent"], USER_AGENT)

    def test_http_errors_name_the_status(self):
        server = self.serve(status=403)
        with self.assertRaisesRegex(RuntimeError, f"{server.url} answered HTTP 403"):
            read_about(server.url)

    def test_invalid_json_and_unreachable_hosts_fail_with_the_url(self):
        server = self.serve(body=b"<html>")
        with self.assertRaisesRegex(RuntimeError, f"Cannot read {server.url}"):
            read_about(server.url)
        with self.assertRaisesRegex(RuntimeError, "Cannot read http://127.0.0.1:9/about"):
            read_about("http://127.0.0.1:9/about")


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
