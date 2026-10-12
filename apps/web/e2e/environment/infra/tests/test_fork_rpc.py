import json
import socket
import threading
import unittest
import urllib.error
import urllib.request
from unittest.mock import Mock

from scripts.fork_rpc import dispatch, make_server, validate_request


def logs(start, end="latest"):
    return {
        "jsonrpc": "2.0", "id": 1, "method": "eth_getLogs",
        "params": [{"fromBlock": start, "toBlock": end}],
    }


def closed_port_url():
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return f"http://127.0.0.1:{probe.getsockname()[1]}"


class ForkRpcServerTests(unittest.TestCase):
    def setUp(self):
        self.upstream = closed_port_url()
        self.server = make_server(("127.0.0.1", 0), 100, self.upstream)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.server.shutdown)
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}"

    def post(self, body):
        request = urllib.request.Request(self.url, data=body, headers={"Content-Type": "application/json"})
        with self.assertRaises(urllib.error.HTTPError) as error:
            urllib.request.urlopen(request, timeout=10)
        error.exception.close()
        return error.exception.code

    def test_malformed_json_is_a_client_error(self):
        self.assertEqual(self.post(b"{not json"), 400)

    def test_unreachable_upstream_is_logged_without_its_url(self):
        body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "eth_blockNumber"}).encode()
        with self.assertLogs(level="ERROR") as logged:
            self.assertEqual(self.post(body), 502)
        self.assertIn("URLError", logged.output[0])
        self.assertNotIn(self.upstream, logged.output[0])


class ForkRpcTests(unittest.TestCase):
    def test_forwards_boundary_and_new_blocks(self):
        forward = Mock(return_value={"id": 1, "result": []})
        for start in (hex(100), hex(101)):
            request = logs(start)
            self.assertEqual(dispatch(request, 100, forward), {"id": 1, "result": []})
            forward.assert_called_with(request)

    def test_historical_scan_never_reaches_upstream(self):
        forward = Mock()
        result = dispatch(logs(hex(99)), 100, forward)
        self.assertIn("below fork block", result["error"]["message"])
        forward.assert_not_called()

    def test_historical_state_reads_are_allowed(self):
        request = {"id": 2, "method": "eth_getCode", "params": ["0x123", "0x0"]}
        forward = Mock(return_value={"id": 2, "result": "0x1234"})
        self.assertEqual(dispatch(request, 100, forward)["result"], "0x1234")

    def test_each_batch_member_is_checked(self):
        forward = Mock(return_value={"id": 1, "result": []})
        result = dispatch([logs("0x0"), logs("0x64")], 100, forward)
        self.assertIn("error", result[0])
        self.assertIn("result", result[1])
        self.assertEqual(forward.call_count, 1)

    def test_missing_ambiguous_and_hash_bounds_are_rejected(self):
        queries = [
            {}, {"blockHash": "0xabc"}, {"fromBlock": "earliest", "toBlock": "latest"},
            {"fromBlock": "latest", "toBlock": "latest"},
            {"fromBlock": "0x64", "toBlock": "safe"},
            {"fromBlock": "0x64", "toBlock": "0x1"},
            {"fromBlock": "0xno", "toBlock": "latest"},
        ]
        for query in queries:
            with self.subTest(query=query), self.assertRaises(ValueError):
                validate_request({"method": "eth_getLogs", "params": [query]}, 100)

    def test_unsupported_indexing_methods_cannot_bypass_guard(self):
        for method in ("trace_filter", "trace_block", "debug_traceTransaction", "eth_newFilter", "eth_getFilterLogs"):
            with self.subTest(method=method), self.assertRaises(ValueError):
                validate_request({"method": method, "params": []}, 100)


if __name__ == "__main__":
    unittest.main()
