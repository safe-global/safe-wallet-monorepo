import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

RATES = {"usd": 2000, "eur": 1800}
NATIVE_RATES = {"ethereum": RATES, "polygon-ecosystem-token": {"usd": 0.5, "eur": 0.45}}


def fixture_response(path):
    url = urlparse(path)
    query = parse_qs(url.query)
    if url.path == "/health":
        return 200, {"ready": True}
    if url.path == "/simple/supported_vs_currencies":
        return 200, list(RATES)
    if url.path == "/simple/price":
        currencies = query.get("vs_currencies", [""])[0].split(",")
        if any(currency not in RATES for currency in currencies):
            return 400, {"error": "Unsupported fixture currency"}
        prices = {}
        for coin in query.get("ids", [""])[0].split(","):
            if coin not in NATIVE_RATES:
                continue
            prices[coin] = {}
            for currency in currencies:
                prices[coin][currency] = NATIVE_RATES[coin][currency]
                prices[coin][currency + "_24h_change"] = 0
        return 200, prices
    if url.path.startswith("/simple/token_price/"):
        return 200, {}
    return 404, {"error": "No provider fixture"}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        status, body = fixture_response(self.path)
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *_args):
        pass


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 8091), Handler).serve_forever()
