"""Relays sponsored Safe transactions to the local forks in place of the hosted relay provider.

The gateway (RELAY_PROVIDER_API_BASE_URI) validates the call and keeps the daily limit itself, as with
the real provider. This mock only submits the call from an impersonated relayer account and reports the
task status; the transaction hash is the task ID.
"""

import json
import os
import re
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# The relay task states the gateway passes on to the wallet.
SUBMITTED = 110
INCLUDED = 200
REVERTED = 500

RELAYER = "0x5afe00000000000000000000000000000000beef"
RELAYER_BALANCE = hex(10**21)
TASK_STATUS = re.compile(r"/safe-transactions/(0x[0-9a-fA-F]{64})/status")


class RpcError(Exception):
    pass


def parse_rpc_urls(value):
    """Parses "chainId=url,chainId=url" into a chain ID to RPC URL map."""
    urls = dict(entry.split("=", 1) for entry in value.split(",") if entry)
    if not urls:
        raise ValueError("RELAY_RPC_URLS must list at least one chainId=url")
    return urls


def json_rpc(url, method, params):
    request = urllib.request.Request(
        url,
        data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.load(response)
    if "error" in payload:
        raise RpcError(f"{method} failed: {payload['error'].get('message')}")
    return payload["result"]


def rejection(status, message):
    return status, {"errors": [{"message": message}]}


def relay(body, rpc_urls, rpc):
    url = rpc_urls.get(str(body.get("chainId")))
    if url is None:
        return rejection(400, f"No local fork for chain {body.get('chainId')}")
    if not body.get("to") or not body.get("data"):
        return rejection(400, "Relay requests need to and data")
    rpc(url, "anvil_setBalance", [RELAYER, RELAYER_BALANCE])
    rpc(url, "anvil_impersonateAccount", [RELAYER])
    try:
        task_id = rpc(url, "eth_sendTransaction", [{"from": RELAYER, "to": body["to"], "data": body["data"]}])
    except RpcError as error:
        return rejection(400, str(error))
    return 200, {"taskId": task_id}


def task_status(task_id, rpc_urls, rpc):
    # Task IDs are transaction hashes, so the fork that knows the transaction holds the task.
    for url in rpc_urls.values():
        try:
            if rpc(url, "eth_getTransactionByHash", [task_id]) is None:
                continue
        except OSError:
            continue
        receipt = rpc(url, "eth_getTransactionReceipt", [task_id])
        if receipt is None:
            return 200, {"taskId": task_id, "status": SUBMITTED}
        status = INCLUDED if int(receipt["status"], 16) == 1 else REVERTED
        return 200, {"taskId": task_id, "status": status, "transactionHash": task_id}
    return rejection(404, f"Unknown relay task {task_id}")


def dispatch(method, path, body, rpc_urls, rpc=json_rpc):
    """Returns the status code and JSON payload for a relay provider request."""
    if method == "GET" and path == "/health":
        return 200, {"ready": True}
    if method == "POST" and path == "/safe-transactions":
        return relay(body or {}, rpc_urls, rpc)
    match = TASK_STATUS.fullmatch(path)
    if method == "GET" and match:
        return task_status(match.group(1), rpc_urls, rpc)
    return rejection(404, f"No route for {method} {path}")


def serve():
    rpc_urls = parse_rpc_urls(os.environ["RELAY_RPC_URLS"])

    class Handler(BaseHTTPRequestHandler):
        def respond(self, method):
            length = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(length)) if length else None
            try:
                status, payload = dispatch(method, self.path.split("?")[0], body, rpc_urls)
            except (OSError, RpcError) as error:
                status, payload = rejection(502, f"Local fork unavailable: {error}")
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

    ThreadingHTTPServer(("0.0.0.0", 8092), Handler).serve_forever()


if __name__ == "__main__":
    serve()
