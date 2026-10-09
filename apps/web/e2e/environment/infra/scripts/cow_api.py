"""Serves recorded Sepolia CoW Protocol orders to the gateway in place of https://api.cow.fi.

Scenarios replay the staging transactions from new Safes, so an order is found by its validTo
(the last four bytes of its UID) and returned with the staging owner replaced by the requested one.
Requests without a recording return 404 when COW_API_OFFLINE is true, as in the stack; otherwise
they go to the real API, which helps capture new recordings locally.
Scenarios register replayed settlements (`register-settlement <tx hash> <order uid>...`), because
the gateway looks up the orders of a settlement by its local transaction hash.
"""

import http.client
import json
import os
import re
import socket
import ssl
import subprocess
import sys
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ORDERS_FILE = Path(__file__).with_name("cow_api_orders.json")
TLS_DIR = Path("/tls")
UPSTREAM = "api.cow.fi"
PREFIX = "/sepolia/api/v1"
SETTLEMENTS_DIR = Path("/tmp/settlements")
UID = re.compile(r"0x[0-9a-f]{112}")
TX_HASH = re.compile(r"0x[0-9a-f]{64}")


def load_fixtures(path=ORDERS_FILE):
    data = json.loads(path.read_text())
    orders = {order["uid"][-8:]: order for order in data["orders"]}
    if len(orders) != len(data["orders"]):
        raise ValueError("Recorded orders must have unique validTo values")
    return orders, data["appData"]


def order_response(orders, uid):
    recorded = orders.get(uid[-8:])
    if recorded is None:
        return None
    owner = "0x" + uid[66:106]
    order = json.loads(json.dumps(recorded).replace(recorded["owner"], owner))
    order["uid"] = uid
    return 200, order


def register_settlement(tx_hash, uids, directory=SETTLEMENTS_DIR):
    tx_hash, uids = tx_hash.lower(), [uid.lower() for uid in uids]
    if not TX_HASH.fullmatch(tx_hash) or not uids or not all(UID.fullmatch(uid) for uid in uids):
        raise ValueError("Usage: register-settlement <transaction hash> <order uid>...")
    directory.mkdir(parents=True, exist_ok=True)
    (directory / f"{tx_hash}.json").write_text(json.dumps(uids))


def settlement_response(orders, tx_hash, directory):
    path = directory / f"{tx_hash}.json"
    if not TX_HASH.fullmatch(tx_hash) or not path.exists():
        return None
    responses = [order_response(orders, uid) for uid in json.loads(path.read_text())]
    if None in responses:
        raise ValueError(f"Settlement {tx_hash} references an unrecorded order")
    return 200, [order for _, order in responses]


def fixture_response(fixtures, path, settlements=SETTLEMENTS_DIR):
    """Returns the recorded response, or None when the request has no recording."""
    orders, app_data = fixtures
    if path == "/health":
        return 200, {"ready": True}
    if not path.startswith(PREFIX + "/"):
        return None
    resource, _, value = path[len(PREFIX) + 1:].lower().partition("/")
    if resource == "orders" and UID.fullmatch(value):
        return order_response(orders, value)
    if resource == "app_data" and value in app_data:
        return 200, app_data[value]
    if resource == "transactions" and value.endswith("/orders"):
        return settlement_response(orders, value.removesuffix("/orders"), settlements)
    return None


def upstream_address():
    # Inside the stack api.cow.fi resolves to this mock, so the real address comes from public DNS.
    request = urllib.request.Request(
        f"https://1.1.1.1/dns-query?name={UPSTREAM}&type=A",
        headers={"Accept": "application/dns-json"},
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        answers = json.load(response).get("Answer", [])
    return next(answer["data"] for answer in answers if answer["type"] == 1)


def upstream_response(path):
    connection = http.client.HTTPConnection(UPSTREAM, timeout=30)
    try:
        raw = socket.create_connection((upstream_address(), 443), timeout=30)
        connection.sock = ssl.create_default_context().wrap_socket(raw, server_hostname=UPSTREAM)
        connection.request("GET", path, headers={"Accept": "application/json"})
        response = connection.getresponse()
        return response.status, response.read()
    except (OSError, StopIteration, ValueError) as error:
        failure = {"errorType": "UpstreamUnavailable", "description": f"{UPSTREAM}{path}: {error}"}
        return 502, json.dumps(failure).encode()
    finally:
        connection.close()


def respond(fixtures, path, offline, upstream=upstream_response):
    recorded = fixture_response(fixtures, path.split("?")[0])
    if recorded:
        return recorded[0], json.dumps(recorded[1]).encode()
    if offline:
        missing = {"errorType": "NotFound", "description": f"No recorded response for {path}"}
        return 404, json.dumps(missing).encode()
    return upstream(path)


def ensure_certificate():
    cert, key = TLS_DIR / "cert.pem", TLS_DIR / "key.pem"
    if not cert.exists():
        subprocess.run(
            [
                "openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "3650",
                "-subj", "/CN=api.cow.fi", "-addext", "subjectAltName=DNS:api.cow.fi",
                "-keyout", str(key), "-out", str(cert),
            ],
            check=True,
            capture_output=True,
        )
    return cert, key


def serve():
    fixtures = load_fixtures()
    offline = os.environ.get("COW_API_OFFLINE") == "true"
    cert, key = ensure_certificate()

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            status, data = respond(fixtures, self.path, offline)
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def log_message(self, *_args):
            pass

    server = ThreadingHTTPServer(("0.0.0.0", 443), Handler)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(cert, key)
    server.socket = context.wrap_socket(server.socket, server_side=True)
    server.serve_forever()


if __name__ == "__main__":
    if sys.argv[1:2] == ["register-settlement"]:
        register_settlement(sys.argv[2], sys.argv[3:])
    else:
        serve()
