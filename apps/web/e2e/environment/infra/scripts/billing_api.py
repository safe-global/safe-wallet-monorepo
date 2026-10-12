"""Answers the gateway's billing service calls (SAFE_BILLING_SERVICE_BASE_URI) in place of the hosted service.

Every Workspace holds a Business trial, as on staging, unless a test stores another subscription through
POST /__test/customers/{id}/subscriptions (body: optional "plan" business|starter, "status", "metadata").
Like the real service, the mock announces each subscription to the gateway with a signed webhook, which is
what writes the Workspace's entitlements.
"""

import base64
import json
import os
import re
import sys
import threading
import time
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PRODUCT_ID = "prod_UwFCHLTTR3EAkt"
PERIOD_START = 1767225600  # 2026-01-01T00:00:00Z
PERIOD_END = 4102444800  # 2100-01-01T00:00:00Z
CUSTOMER_GROUP = "wallet_web"
SERVICE_ACCESS_ROLE = "SERVICE_ACCESS"
TOKEN_LIFETIME_SECONDS = 3600
WEBHOOK_ATTEMPTS = 5
DEFAULT_PLAN = "business"

# Copied from staging Workspace subscriptions.
PLANS = {
    "business": {
        "price": {"id": "price_1ULiB9PDjZa9uJScGuwyKa6V", "currentPrice": 1669},
        "metadata": {
            "FEATURE_COPILOT_SCANS": "true",
            "FEATURE_POLICIES": "true",
            "FEATURE_SAFE_SEATS": "20",
            "FEATURE_SPONSORED_TRANSACTIONS": "50",
            "planCode": "BUS-20-M",
            "planDescriptions": json.dumps(
                [
                    "50 sponsored transactions per month",
                    "Shared address book",
                    "Activity log",
                    "Advanced threat analysis",
                    "Transaction simulation",
                    "MFA authentication",
                    "Policy engine",
                    "Transaction proposers",
                    "Priority support + guided onboarding",
                ]
            ),
            "planName": "Business",
            "planType": "wallet-trial",
        },
    },
    "starter": {
        "price": {"id": "price_1ULiDIPDjZa9uJScut0wtEzS", "currentPrice": 189},
        "metadata": {
            "FEATURE_COPILOT_SCANS": "true",
            "FEATURE_POLICIES": "false",
            "FEATURE_SAFE_SEATS": "2",
            "FEATURE_SPONSORED_TRANSACTIONS": "10",
            "planCode": "STA-2-M",
            "planDescriptions": json.dumps(
                [
                    "10 sponsored transactions per month",
                    "Shared address book",
                    "Activity log",
                    "Advanced threat analysis",
                    "Transaction simulation",
                    "Standard support (in-app and email)",
                ]
            ),
            "planName": "Starter",
            "planType": "wallet-global",
        },
    },
}


def plan_price(plan):
    return {
        **PLANS[plan]["price"],
        "originalPrice": None,
        "paymentMethod": "fiat",
        "currency": "eur",
        "features": [],
        "billingCycle": "month",
        "type": "standard",
    }


def plan_of_price(price_id):
    return next((plan for plan, entry in PLANS.items() if entry["price"]["id"] == price_id), None)

CUSTOMER_PATH = re.compile(r"/api/v1/customers/([0-9a-fA-F-]+)/subscriptions")
TEST_CUSTOMER_PATH = re.compile(r"/__test/customers/([0-9a-fA-F-]+)/subscriptions")
PLAN_PATH = re.compile(r"/api/v1/plans/([^/]+)")


def customer_key(customer_id):
    """The gateway sends Space UUIDs without dashes; tests may send them with."""
    return customer_id.replace("-", "").lower()


def default_subscription(customer, overrides=None):
    overrides = overrides or {}
    plan = overrides.get("plan", DEFAULT_PLAN)
    if plan not in PLANS:
        raise ValueError(f"Unknown plan {plan!r}; use one of {sorted(PLANS)}")
    metadata = {
        **PLANS[plan]["metadata"],
        "customerGroup": CUSTOMER_GROUP,
        "gracePeriod": "true",
        **overrides.get("metadata", {}),
    }
    return {
        "id": f"sub_e2e_{customer}",
        "customerId": f"cus_e2e_{customer}",
        "upstreamCustomerId": customer,
        "plan": {**plan_price(plan), "product": PRODUCT_ID},
        "status": overrides.get("status", "trialing"),
        "createdAt": PERIOD_START,
        "startAt": PERIOD_START,
        "cancelledAt": None,
        "cancelAt": None,
        "currentPeriodStart": PERIOD_START,
        "currentPeriodEnd": PERIOD_END,
        "metadata": metadata,
        "hasPaymentMethod": False,
    }


def subscription_event(subscription, created):
    return {
        "id": f"evt_e2e_{subscription['upstreamCustomerId']}_{created}",
        "type": "customer.subscription.created",
        "created": created,
        "data": {
            "subscriptionId": subscription["id"],
            "status": subscription["status"],
            "planId": subscription["plan"]["id"],
            "currentPeriodStart": subscription["currentPeriodStart"],
            "currentPeriodEnd": subscription["currentPeriodEnd"],
            "metadata": subscription["metadata"],
            "customer": {
                "customerGroup": CUSTOMER_GROUP,
                "upstreamCustomerId": subscription["upstreamCustomerId"],
                "customerId": subscription["customerId"],
            },
        },
    }


def base64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def es256_signer(private_key_hex):
    """Signs with the P-256 test key; pycryptodome ships with the Transaction Service image (via web3)."""
    from Crypto.Hash import SHA256
    from Crypto.PublicKey import ECC
    from Crypto.Signature import DSS

    key = ECC.construct(curve="P-256", d=int(private_key_hex, 16))
    return lambda message: DSS.new(key, "fips-186-3").sign(SHA256.new(message))


def service_token(issuer, sign, now):
    """The service token the gateway's BillingWebhookAuthGuard accepts (iss = aud = its own issuer)."""
    header = base64url(json.dumps({"alg": "ES256", "typ": "JWT"}).encode())
    claims = {
        "iss": issuer,
        "sub": "billing-service",
        "aud": [issuer],
        "iat": now,
        "exp": now + TOKEN_LIFETIME_SECONDS,
        "roles": [SERVICE_ACCESS_ROLE],
    }
    signing_input = f"{header}.{base64url(json.dumps(claims).encode())}"
    return f"{signing_input}.{base64url(sign(signing_input.encode()))}"


def post_webhook(url, token, event):
    request = urllib.request.Request(
        url,
        data=json.dumps(event).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.status


class Billing:
    """Subscriptions by customer, and the webhook that announces them to the gateway."""

    def __init__(self, announce):
        self.subscriptions = {}
        self.lock = threading.Lock()
        self.announce = announce

    def list_subscriptions(self, customer):
        with self.lock:
            created = customer not in self.subscriptions
            if created:
                self.subscriptions[customer] = [default_subscription(customer)]
            subscriptions = list(self.subscriptions[customer])
        if created:
            threading.Thread(target=self.announce, args=(subscriptions[0],), daemon=True).start()
        return subscriptions

    def store(self, customer, overrides):
        subscription = default_subscription(customer, overrides)
        with self.lock:
            self.subscriptions[customer] = [subscription]
        self.announce(subscription)
        return subscription


def dispatch(method, path, query, body, billing):
    """Returns the status code and JSON payload for a billing service request."""
    if method == "GET" and path == "/health":
        return 200, {"ready": True}
    match = CUSTOMER_PATH.fullmatch(path)
    if method == "GET" and match:
        subscriptions = billing.list_subscriptions(customer_key(match.group(1)))
        status = query.get("status", "all")
        return 200, {"subscriptions": [s for s in subscriptions if status in ("all", s["status"])]}
    if method == "GET" and path == "/api/v1/payment-links":
        return 200, {"paymentLinks": []}
    match = PLAN_PATH.fullmatch(path)
    plan = plan_of_price(match.group(1)) if match else None
    if method == "GET" and plan:
        product = {
            "id": PRODUCT_ID,
            "active": True,
            "description": "Safe Pro",
            "marketingFeatures": [],
            "metadata": {},
            "name": PLANS[plan]["metadata"]["planName"],
        }
        return 200, {**plan_price(plan), "product": product}
    match = TEST_CUSTOMER_PATH.fullmatch(path)
    if method == "POST" and match:
        try:
            return 200, billing.store(customer_key(match.group(1)), body or {})
        except ValueError as error:
            return 400, {"message": str(error)}
    return 404, {"message": f"The local billing service does not support {method} {path}"}


def announcer(webhook_url, issuer, sign):
    def announce(subscription):
        now = int(time.time())
        event = subscription_event(subscription, now)
        for attempt in range(1, WEBHOOK_ATTEMPTS + 1):
            try:
                return post_webhook(webhook_url, service_token(issuer, sign, now), event)
            except OSError as error:
                message = f"Billing webhook {event['id']} attempt {attempt} failed: {error}"
                print(message, file=sys.stderr, flush=True)
                time.sleep(attempt)
        raise RuntimeError(f"The gateway did not accept billing webhook {event['id']}")

    return announce


def serve():
    billing = Billing(
        announcer(
            os.environ["BILLING_WEBHOOK_URL"],
            os.environ["BILLING_WEBHOOK_JWT_ISSUER"],
            es256_signer(os.environ["BILLING_WEBHOOK_SIGNING_KEY"]),
        )
    )

    class Handler(BaseHTTPRequestHandler):
        def respond(self, method):
            length = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(length)) if length else None
            path, _, query = self.path.partition("?")
            params = dict(pair.split("=", 1) for pair in query.split("&") if "=" in pair)
            try:
                status, payload = dispatch(method, path, params, body, billing)
            except RuntimeError as error:
                status, payload = 502, {"message": str(error)}
            data = json.dumps(payload).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            self.respond("GET")

        def do_POST(self):
            self.respond("POST")

        def log_message(self, *_args):
            pass

    ThreadingHTTPServer(("0.0.0.0", 8093), Handler).serve_forever()


if __name__ == "__main__":
    serve()
