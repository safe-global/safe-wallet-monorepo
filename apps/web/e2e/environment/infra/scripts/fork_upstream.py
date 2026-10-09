"""Forwards Anvil's fork requests to the archive RPC in FORK_UPSTREAM_URL.

Anvil names its fork cache after the hash of its fork URL. Forking from this proxy keeps that URL, and so the
committed cache in fork-cache/, the same for every RPC provider and key. The secret URL is never logged.
"""

import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = 8546
MAX_BODY_BYTES = 4 * 1024 * 1024
TIMEOUT_SECONDS = 60
# Infura's mainnet archive answers some concurrent reads with this code, and Anvil does not retry it.
INTERNAL_ERROR = -32603
INTERNAL_ERROR_ATTEMPTS = 4


def has_internal_error(body):
    try:
        responses = json.loads(body)
    except ValueError:
        return False
    responses = responses if isinstance(responses, list) else [responses]
    return any(isinstance(r, dict) and (r.get("error") or {}).get("code") == INTERNAL_ERROR for r in responses)


def forward(upstream, payload, post=None, pause=time.sleep):
    """Returns the upstream status and body; retries answers that report a transient internal error."""
    post = post or post_upstream
    for attempt in range(INTERNAL_ERROR_ATTEMPTS):
        status, body = post(upstream, payload)
        if status != 200 or not has_internal_error(body) or attempt == INTERNAL_ERROR_ATTEMPTS - 1:
            return status, body
        pause(0.5 * 2**attempt)


def post_upstream(upstream, payload):
    request = urllib.request.Request(upstream, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        # Anvil retries on 429 and 5xx, so pass the status through unchanged.
        return error.code, error.read()
    except OSError as error:
        print(f"Fork upstream request failed: {type(error).__name__}", file=sys.stderr, flush=True)
        return 502, b""


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/status":
            # How many requests reached the archive RPC; a complete fork cache keeps this low.
            body = json.dumps({"forwarded": self.server.forwarded}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_response(200 if self.path == "/health" else 404)
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        if not 0 < length <= MAX_BODY_BYTES:
            self.send_response(400)
            self.end_headers()
            return
        with self.server.lock:
            self.server.forwarded += 1
        status, body = forward(self.server.upstream, self.rfile.read(length))
        try:
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            # Anvil gave up on this request and retries it on a new connection.
            pass

    def log_message(self, *args):
        pass


def main():
    upstream = os.environ.get("FORK_UPSTREAM_URL", "")
    if not upstream.startswith(("http://", "https://")):
        sys.exit("Set FORK_UPSTREAM_URL to the archive RPC of this fork")
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    server.upstream = upstream
    server.forwarded = 0
    server.lock = threading.Lock()
    server.serve_forever()


if __name__ == "__main__":
    main()
