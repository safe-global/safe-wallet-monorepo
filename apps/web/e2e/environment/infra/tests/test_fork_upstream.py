import json
import unittest

from scripts.fork_upstream import INTERNAL_ERROR_ATTEMPTS, forward, has_internal_error

INTERNAL = json.dumps({"jsonrpc": "2.0", "id": 1, "error": {"code": -32603, "message": "Internal error"}}).encode()
RESULT = json.dumps({"jsonrpc": "2.0", "id": 1, "result": "0x1"}).encode()


class Upstream:
    def __init__(self, *answers):
        self.answers = list(answers)
        self.calls = 0

    def __call__(self, url, payload):
        self.calls += 1
        return self.answers.pop(0)


class ForkUpstreamTests(unittest.TestCase):
    def test_retries_a_transient_internal_error(self):
        upstream = Upstream((200, INTERNAL), (200, RESULT))
        self.assertEqual(forward("https://rpc", b"{}", upstream, pause=lambda _: None), (200, RESULT))
        self.assertEqual(upstream.calls, 2)

    def test_returns_the_error_after_the_last_attempt(self):
        upstream = Upstream(*[(200, INTERNAL)] * INTERNAL_ERROR_ATTEMPTS)
        self.assertEqual(forward("https://rpc", b"{}", upstream, pause=lambda _: None), (200, INTERNAL))
        self.assertEqual(upstream.calls, INTERNAL_ERROR_ATTEMPTS)

    def test_passes_other_errors_and_statuses_through_at_once(self):
        not_found = json.dumps({"error": {"code": -32601, "message": "missing"}}).encode()
        for answer in ((200, not_found), (429, b"rate limited"), (502, b"")):
            upstream = Upstream(answer)
            self.assertEqual(forward("https://rpc", b"{}", upstream, pause=lambda _: None), answer)
            self.assertEqual(upstream.calls, 1)

    def test_detects_internal_errors_in_batches_only_by_code(self):
        self.assertTrue(has_internal_error(b"[" + RESULT + b"," + INTERNAL + b"]"))
        self.assertFalse(has_internal_error(b"[" + RESULT + b"]"))
        self.assertFalse(has_internal_error(b"not json"))
        self.assertFalse(has_internal_error(b'{"error": null}'))


if __name__ == "__main__":
    unittest.main()
