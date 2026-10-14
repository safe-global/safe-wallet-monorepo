import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

from scripts.cow_api import PREFIX, fixture_response, load_fixtures, register_settlement, respond

STAGING_OWNER = "03042b890b99552b60a073f808100517fb148f60"
LOCAL_OWNER = "1234567890abcdef1234567890abcdef12345678"
DIGEST = "49ebbf8fe2f57ae022dca12284bcf21a3885ed705cea3426513579b1419b932c"
VALID_TO = "66700727"


class CowApiFixturesTest(unittest.TestCase):
    fixtures = load_fixtures()

    def get(self, path):
        return fixture_response(self.fixtures, PREFIX + path)

    def test_recorded_order_is_served_for_the_replaying_safe(self):
        uid = f"0x{DIGEST}{LOCAL_OWNER}{VALID_TO}"
        status, order = self.get(f"/orders/{uid}")
        self.assertEqual(status, 200)
        self.assertEqual(order["uid"], uid)
        self.assertEqual(order["owner"], f"0x{LOCAL_OWNER}")
        self.assertEqual(order["receiver"], f"0x{LOCAL_OWNER}")
        self.assertEqual(order["status"], "fulfilled")
        self.assertNotIn(STAGING_OWNER, str(order))

    def test_order_with_a_recomputed_digest_is_found_by_valid_to(self):
        uid = f"0x{'ab' * 32}{LOCAL_OWNER}{VALID_TO}"
        status, order = self.get(f"/orders/{uid}")
        self.assertEqual((status, order["uid"]), (200, uid))

    def test_recorded_app_data_is_served(self):
        app_data = next(iter(self.fixtures[1]))
        status, body = self.get(f"/app_data/{app_data}")
        self.assertEqual(status, 200)
        self.assertIn("appCode", body["fullAppData"])

    def test_unrecorded_requests_are_left_to_the_real_api(self):
        self.assertIsNone(self.get(f"/orders/0x{DIGEST}{LOCAL_OWNER}00000000"))
        self.assertIsNone(self.get(f"/app_data/0x{'00' * 32}"))
        self.assertIsNone(self.get(f"/transactions/0x{'00' * 32}/orders"))
        self.assertIsNone(self.get("/orders/not-a-uid"))
        self.assertIsNone(fixture_response(self.fixtures, "/mainnet/api/v1/orders/x"))

    def test_offline_mode_answers_unrecorded_requests_without_the_real_api(self):
        upstream = Mock(return_value=(200, b"{}"))
        path = f"{PREFIX}/orders/0x{DIGEST}{LOCAL_OWNER}00000000"
        status, body = respond(self.fixtures, path, offline=True, upstream=upstream)
        self.assertEqual((status, json.loads(body)["errorType"]), (404, "NotFound"))
        upstream.assert_not_called()

    def test_recording_mode_forwards_only_unrecorded_requests(self):
        upstream = Mock(return_value=(200, b"{}"))
        recorded = f"{PREFIX}/orders/0x{DIGEST}{LOCAL_OWNER}{VALID_TO}?extra=1"
        self.assertEqual(respond(self.fixtures, recorded, offline=False, upstream=upstream)[0], 200)
        upstream.assert_not_called()
        unrecorded = f"{PREFIX}/orders/0x{DIGEST}{LOCAL_OWNER}00000000"
        self.assertEqual(respond(self.fixtures, unrecorded, offline=False, upstream=upstream), (200, b"{}"))
        upstream.assert_called_once_with(unrecorded)

    def test_registered_settlement_returns_its_orders_for_the_local_safe(self):
        uid = f"0x{DIGEST}{LOCAL_OWNER}{VALID_TO}"
        tx_hash = "0x" + "ab" * 32
        with tempfile.TemporaryDirectory() as directory:
            register_settlement(tx_hash, [uid.upper().replace("0X", "0x")], Path(directory))
            path = f"{PREFIX}/transactions/{tx_hash}/orders"
            status, orders = fixture_response(self.fixtures, path, Path(directory))
            unregistered = f"{PREFIX}/transactions/0x{'cd' * 32}/orders"
            self.assertIsNone(fixture_response(self.fixtures, unregistered, Path(directory)))
        self.assertEqual(status, 200)
        self.assertEqual([order["uid"] for order in orders], [uid])
        self.assertEqual(orders[0]["owner"], f"0x{LOCAL_OWNER}")

    def test_settlements_must_reference_recorded_orders(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError):
                register_settlement("0x" + "ab" * 32, ["not-a-uid"], Path(directory))
            unrecorded = f"0x{DIGEST}{LOCAL_OWNER}00000000"
            register_settlement("0x" + "ab" * 32, [unrecorded], Path(directory))
            path = f"{PREFIX}/transactions/0x{'ab' * 32}/orders"
            with self.assertRaises(ValueError):
                fixture_response(self.fixtures, path, Path(directory))
