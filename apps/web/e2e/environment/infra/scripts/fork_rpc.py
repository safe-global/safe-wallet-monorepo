import json
import logging
import os
import threading
from http.client import HTTPException
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def validate_request(request, fork_block):
    if not isinstance(request, dict) or not isinstance(request.get("method"), str):
        raise ValueError("Invalid RPC request")
    method = request["method"]
    if method.startswith(("trace_", "debug_trace")) or method in (
        "eth_newFilter", "eth_getFilterLogs", "eth_getFilterChanges",
    ):
        raise ValueError("Fork TXS profile supports eth_getLogs indexing only")
    if method == "eth_getLogs":
        validate_log_filter(request.get("params", []), fork_block)


def validate_log_filter(params, fork_block):
    if not isinstance(params, list) or len(params) != 1 or not isinstance(params[0], dict):
        raise ValueError("Invalid log filter")
    query = params[0]
    if "blockHash" in query:
        raise ValueError("Fork log filters require an explicit block range")
    for field in ("fromBlock", "toBlock"):
        validate_log_bound(field, query.get(field), fork_block)


def validate_log_bound(field, value, fork_block):
    if value in ("latest", "pending"):
        if field == "fromBlock":
            raise ValueError("Fork log filters require an explicit numeric fromBlock")
        return
    if not isinstance(value, str) or not value.startswith("0x"):
        raise ValueError("Fork log filters require explicit block bounds")
    try:
        block = int(value, 16)
    except ValueError as exc:
        raise ValueError("Invalid log block number") from exc
    if block < fork_block:
        raise ValueError(f"Historical indexing below fork block {fork_block} is forbidden")


def dispatch(payload, fork_block, forward, on_reject=None):
    def execute(request):
        try:
            validate_request(request, fork_block)
        except ValueError as exc:
            logging.warning("Rejected indexing RPC: %s", exc)
            if on_reject:
                on_reject()
            return {
                "jsonrpc": "2.0", "id": request.get("id") if isinstance(request, dict) else None,
                "error": {"code": -32602, "message": str(exc)},
            }
        return forward(request)

    if isinstance(payload, list):
        return [execute(request) for request in payload]
    return execute(payload)


class RpcHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/status":
            with self.server.stats_lock:
                stats = dict(self.server.stats)
            self.send_json(stats)
            return
        self.send_response(200 if self.path == "/health" else 404)
        self.end_headers()

    def do_POST(self):
        try:
            payload = self.read_payload()
        except ValueError as exc:
            self.send_error(400, f"Invalid JSON-RPC request: {exc}")
            return
        try:
            result = dispatch(payload, self.server.fork_block, self.forward, self.record_rejection)
        except (ValueError, OSError, HTTPException) as exc:
            logging.error("Fork RPC upstream request failed: %s", type(exc).__name__)
            self.send_error(502, "Fork RPC request failed")
            return
        self.send_json(result)

    def read_payload(self):
        length = int(self.headers.get("Content-Length", "0"))
        if not 0 < length <= 4 * 1024 * 1024:
            raise ValueError("invalid request length")
        return json.loads(self.rfile.read(length))

    def send_json(self, value):
        body = json.dumps(value).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def record_rejection(self):
        with self.server.stats_lock:
            self.server.stats["rejectedRequests"] += 1

    def forward(self, payload):
        if payload["method"] == "eth_getLogs":
            start = int(payload["params"][0]["fromBlock"], 16)
            with self.server.stats_lock:
                self.server.stats["logRequests"] += 1
                minimum = self.server.stats["minimumFromBlock"]
                self.server.stats["minimumFromBlock"] = start if minimum is None else min(minimum, start)
        request = urllib.request.Request(
            self.server.rpc_url,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.load(response)

    def log_message(self, *args):
        pass


def make_server(address, fork_block, rpc_url):
    if fork_block <= 0:
        raise ValueError("FORK_BLOCK_NUMBER must be positive")
    server = ThreadingHTTPServer(address, RpcHandler)
    server.fork_block = fork_block
    server.rpc_url = rpc_url
    server.stats_lock = threading.Lock()
    server.stats = {
        "forkBlock": fork_block, "logRequests": 0, "minimumFromBlock": None, "rejectedRequests": 0,
    }
    return server


if __name__ == "__main__":
    make_server(
        ("0.0.0.0", 8546), int(os.environ["FORK_BLOCK_NUMBER"]), os.environ["FORK_RPC_TARGET"],
    ).serve_forever()
