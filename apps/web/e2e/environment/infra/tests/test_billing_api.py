import base64
import json
import re
import threading
import unittest
from importlib.util import find_spec
from pathlib import Path

from scripts.billing_api import (
    PLANS,
    PRODUCT_ID,
    Billing,
    dispatch,
    es256_signer,
    service_token,
    subscription_event,
)

BUSINESS_PRICE = PLANS["business"]["price"]["id"]
STARTER_PRICE = PLANS["starter"]["price"]["id"]
SPACE_UUID = "1f0e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b"
CUSTOMER = SPACE_UUID.replace("-", "")
COMPOSE = (Path(__file__).parents[1] / "docker-compose.test.yml").read_text()


class RecordingAnnouncer:
    def __init__(self):
        self.subscriptions = []
        self.called = threading.Event()

    def __call__(self, subscription):
        self.subscriptions.append(subscription)
        self.called.set()


def subscriptions_of(billing, customer=CUSTOMER, query=None):
    path = f"/api/v1/customers/{customer}/subscriptions"
    return dispatch("GET", path, query or {}, None, billing)


def decode_segment(segment):
    return json.loads(base64.urlsafe_b64decode(segment + "=" * (-len(segment) % 4)))


class BillingApiTests(unittest.TestCase):
    def test_an_unknown_workspace_gets_the_business_trial_and_announces_it(self):
        announce = RecordingAnnouncer()
        billing = Billing(announce)
        status, payload = subscriptions_of(billing)
        self.assertEqual(status, 200)
        [subscription] = payload["subscriptions"]
        self.assertEqual(subscription["status"], "trialing")
        self.assertEqual(subscription["upstreamCustomerId"], CUSTOMER)
        self.assertEqual(subscription["plan"]["id"], BUSINESS_PRICE)
        self.assertEqual(subscription["metadata"]["planCode"], "BUS-20-M")
        self.assertEqual(subscription["metadata"]["customerGroup"], "wallet_web")
        descriptions = json.loads(subscription["metadata"]["planDescriptions"])
        self.assertEqual(descriptions[0], "50 sponsored transactions per month")
        self.assertTrue(announce.called.wait(5))
        self.assertEqual(announce.subscriptions, [subscription])

    def test_answers_the_same_plan_on_every_read_and_announces_once(self):
        announce = RecordingAnnouncer()
        billing = Billing(announce)
        first = subscriptions_of(billing)
        self.assertEqual(subscriptions_of(billing), first)
        self.assertEqual(subscriptions_of(billing, SPACE_UUID), first)
        self.assertTrue(announce.called.wait(5))
        self.assertEqual(len(announce.subscriptions), 1)

    def test_filters_by_status(self):
        billing = Billing(RecordingAnnouncer())
        self.assertEqual(len(subscriptions_of(billing, query={"status": "trialing"})[1]["subscriptions"]), 1)
        self.assertEqual(subscriptions_of(billing, query={"status": "canceled"})[1], {"subscriptions": []})

    def test_a_stored_subscription_is_announced_before_the_call_returns(self):
        announce = RecordingAnnouncer()
        billing = Billing(announce)
        path = f"/__test/customers/{SPACE_UUID}/subscriptions"
        overrides = {"status": "canceled", "metadata": {"FEATURE_SAFE_SEATS": "2"}}
        status, stored = dispatch("POST", path, {}, overrides, billing)
        self.assertEqual(status, 200)
        self.assertEqual(announce.subscriptions, [stored])
        self.assertEqual((stored["status"], stored["metadata"]["FEATURE_SAFE_SEATS"]), ("canceled", "2"))
        self.assertEqual(subscriptions_of(billing)[1], {"subscriptions": [stored]})
        self.assertEqual(len(announce.subscriptions), 1)

    def test_a_test_can_store_the_starter_plan(self):
        billing = Billing(RecordingAnnouncer())
        path = f"/__test/customers/{SPACE_UUID}/subscriptions"
        status, stored = dispatch("POST", path, {}, {"plan": "starter"}, billing)
        self.assertEqual(status, 200)
        self.assertEqual((stored["plan"]["id"], stored["plan"]["currentPrice"]), (STARTER_PRICE, 189))
        self.assertEqual((stored["metadata"]["planName"], stored["metadata"]["FEATURE_POLICIES"]), ("Starter", "false"))

    def test_rejects_an_unknown_plan(self):
        billing = Billing(RecordingAnnouncer())
        path = f"/__test/customers/{SPACE_UUID}/subscriptions"
        status, payload = dispatch("POST", path, {}, {"plan": "enterprise"}, billing)
        self.assertEqual(status, 400)
        self.assertIn("enterprise", payload["message"])
        self.assertEqual(subscriptions_of(billing)[1]["subscriptions"][0]["plan"]["id"], BUSINESS_PRICE)

    def test_offers_no_payment_links_and_serves_both_plans(self):
        billing = Billing(RecordingAnnouncer())
        self.assertEqual(dispatch("GET", "/api/v1/payment-links", {}, None, billing), (200, {"paymentLinks": []}))
        for price, name in ((BUSINESS_PRICE, "Business"), (STARTER_PRICE, "Starter")):
            status, plan = dispatch("GET", f"/api/v1/plans/{price}", {}, None, billing)
            self.assertEqual((status, plan["id"], plan["product"]["id"]), (200, price, PRODUCT_ID))
            self.assertEqual(plan["product"]["name"], name)
        self.assertEqual(dispatch("GET", "/api/v1/plans/other", {}, None, billing)[0], 404)

    def test_rejects_calls_it_cannot_answer(self):
        billing = Billing(RecordingAnnouncer())
        status, payload = dispatch("GET", f"/api/v1/customers/{CUSTOMER}/session-url", {}, None, billing)
        self.assertEqual(status, 404)
        self.assertIn("session-url", payload["message"])

    def test_the_event_carries_a_complete_wallet_web_snapshot(self):
        billing = Billing(RecordingAnnouncer())
        [subscription] = subscriptions_of(billing)[1]["subscriptions"]
        event = subscription_event(subscription, 1_800_000_000)
        self.assertEqual(event["type"], "customer.subscription.created")
        self.assertEqual(event["created"], 1_800_000_000)
        self.assertEqual(
            event["data"]["customer"],
            {"customerGroup": "wallet_web", "upstreamCustomerId": CUSTOMER, "customerId": subscription["customerId"]},
        )
        for key in ("subscriptionId", "status", "planId", "currentPeriodStart", "metadata"):
            self.assertIsNotNone(event["data"][key])

    @unittest.skipUnless(find_spec("Crypto"), "pycryptodome is installed in the Transaction Service image")
    def test_signs_a_service_token_the_gateway_key_verifies(self):
        from Crypto.Hash import SHA256
        from Crypto.PublicKey import ECC
        from Crypto.Signature import DSS

        signing_key = re.search(r"BILLING_WEBHOOK_SIGNING_KEY: (\w+)", COMPOSE).group(1)
        pem = re.search(r"-----BEGIN PUBLIC KEY-----.*?-----END PUBLIC KEY-----", COMPOSE, re.DOTALL).group(0)
        token = service_token("safe-e2e-local", es256_signer(signing_key), 1_800_000_000)
        header, claims, signature = token.split(".")
        self.assertEqual(decode_segment(header)["alg"], "ES256")
        self.assertEqual(
            decode_segment(claims),
            {
                "iss": "safe-e2e-local",
                "sub": "billing-service",
                "aud": ["safe-e2e-local"],
                "iat": 1_800_000_000,
                "exp": 1_800_003_600,
                "roles": ["SERVICE_ACCESS"],
            },
        )
        public_key = ECC.import_key(re.sub(r"\n\s+", "\n", pem))
        raw_signature = base64.urlsafe_b64decode(signature + "=" * (-len(signature) % 4))
        DSS.new(public_key, "fips-186-3").verify(SHA256.new(f"{header}.{claims}".encode()), raw_signature)


if __name__ == "__main__":
    unittest.main()
