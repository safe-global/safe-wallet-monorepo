import unittest
from unittest.mock import Mock

from scripts.relay_api import INCLUDED, RELAYER, REVERTED, SUBMITTED, RpcError, dispatch, parse_rpc_urls

SEPOLIA = "http://anvil:8545"
URLS = {"11155111": SEPOLIA, "1": "http://anvil-mainnet:8547"}
TASK = "0x" + "ab" * 32


def fake_rpc(results):
    def rpc(url, method, params):
        result = results.get((url, method), None)
        if isinstance(result, Exception):
            raise result
        return result

    return Mock(side_effect=rpc)


class RelayApiTests(unittest.TestCase):
    def test_relays_from_the_impersonated_relayer_on_the_requested_fork(self):
        rpc = fake_rpc({(SEPOLIA, "eth_sendTransaction"): TASK})
        status, payload = dispatch(
            "POST", "/safe-transactions", {"chainId": 11155111, "to": "0x1", "data": "0x6a76"}, URLS, rpc
        )
        self.assertEqual((status, payload), (200, {"taskId": TASK}))
        rpc.assert_any_call(SEPOLIA, "anvil_impersonateAccount", [RELAYER])
        rpc.assert_any_call(SEPOLIA, "eth_sendTransaction", [{"from": RELAYER, "to": "0x1", "data": "0x6a76"}])

    def test_rejects_unknown_chains_and_failing_calls(self):
        body = {"chainId": 137, "to": "0x1", "data": "0x"}
        status, payload = dispatch("POST", "/safe-transactions", body, URLS, Mock())
        self.assertEqual(status, 400)
        self.assertIn("137", payload["errors"][0]["message"])
        rpc = fake_rpc({(SEPOLIA, "eth_sendTransaction"): RpcError("execution reverted")})
        status, payload = dispatch(
            "POST", "/safe-transactions", {"chainId": "11155111", "to": "0x1", "data": "0x6a76"}, URLS, rpc
        )
        self.assertEqual(status, 400)
        self.assertIn("reverted", payload["errors"][0]["message"])

    def test_reports_included_reverted_and_pending_tasks(self):
        path = f"/safe-transactions/{TASK}/status"
        for receipt, expected in (({"status": "0x1"}, INCLUDED), ({"status": "0x0"}, REVERTED)):
            rpc = fake_rpc({(SEPOLIA, "eth_getTransactionByHash"): {}, (SEPOLIA, "eth_getTransactionReceipt"): receipt})
            self.assertEqual(
                dispatch("GET", path, None, URLS, rpc),
                (200, {"taskId": TASK, "status": expected, "transactionHash": TASK}),
            )
        rpc = fake_rpc({(SEPOLIA, "eth_getTransactionByHash"): {}})
        self.assertEqual(dispatch("GET", path, None, URLS, rpc), (200, {"taskId": TASK, "status": SUBMITTED}))

    def test_unknown_tasks_and_unavailable_forks(self):
        rpc = fake_rpc({("http://anvil-mainnet:8547", "eth_getTransactionByHash"): OSError("refused")})
        status, _ = dispatch("GET", f"/safe-transactions/{TASK}/status", None, URLS, rpc)
        self.assertEqual(status, 404)

    def test_parses_rpc_urls(self):
        self.assertEqual(
            parse_rpc_urls("11155111=http://anvil:8545,1=http://a:1"),
            {"11155111": SEPOLIA, "1": "http://a:1"},
        )
        with self.assertRaises(ValueError):
            parse_rpc_urls("")


if __name__ == "__main__":
    unittest.main()
