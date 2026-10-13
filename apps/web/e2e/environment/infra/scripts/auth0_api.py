"""Answers the gateway's Auth0 calls (AUTH0_DOMAIN) in place of a hosted tenant, for email sign-in and step-up.

GET /authorize renders a form: an email and a one-time code to sign in, only the code when the gateway asks
for a second factor (acr_values). The code is always CODE; any other code shows an error, as Auth0 does.
"Sign in without a second factor" issues a token without amr, so the session needs a step-up for sensitive
actions. "Do not report the second factor" leaves amr out of a step-up token, which the gateway must refuse.
The gateway exchanges the code at /oauth/token, verifies the ID token with /.well-known/jwks.json and reads
authenticators through the Management API. Tests and scripts post the same form as the browser.
"""

import base64
import hashlib
import html
import json
import os
import secrets
import ssl
import sys
import threading
import time
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

CODE = "123456"
CANCELLED = {"error": "access_denied", "error_description": "User has canceled the interaction."}
MFA_ACR = "http://schemas.openid.net/pape/policies/2007/06/multi-factor"
KEY_ID = "safe-e2e-local"
TOKEN_LIFETIME_SECONDS = 3600
KEYS_DIR = Path("/keys")
SESSION_COOKIE = "auth0_session"


def base64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def user_id(email):
    """A stable Auth0-style subject for an email address."""
    return "email|" + hashlib.sha256(email.lower().encode()).hexdigest()[:24]


def id_token(issuer, audience, email, mfa, sign, now):
    header = base64url(json.dumps({"alg": "RS256", "typ": "JWT", "kid": KEY_ID}).encode())
    claims = {
        "iss": issuer,
        "aud": audience,
        "sub": user_id(email),
        "email": email,
        "email_verified": True,
        "iat": now,
        "exp": now + TOKEN_LIFETIME_SECONDS,
    }
    if mfa:
        claims["amr"] = ["mfa"]
    payload = base64url(json.dumps(claims).encode())
    signature = base64url(sign(f"{header}.{payload}".encode()))
    return f"{header}.{payload}.{signature}"


def redirect(url, params, headers=None):
    separator = "&" if "?" in url else "?"
    return 302, {"Location": url + separator + urllib.parse.urlencode(params), **(headers or {})}, b""


def cookie_value(header, name):
    for part in (header or "").split(";"):
        key, _, value = part.strip().partition("=")
        if key == name:
            return value
    return None


def html_response(status, body):
    return status, {"Content-Type": "text/html; charset=utf-8"}, body.encode()


def json_response(status, payload):
    return status, {"Content-Type": "application/json"}, json.dumps(payload).encode()


def form_page(params, error=None):
    """The sign-in or step-up page; `params` carries the authorize request through the form."""
    elevate = params.get("acr_values") == MFA_ACR
    hidden = "".join(
        f'<input type="hidden" name="{name}" value="{html.escape(params.get(name, ""))}">'
        for name in ("redirect_uri", "state", "acr_values", "ext-enroll-otp")
    )
    email = "" if elevate else '<label>Email <input name="email" type="email" required></label>'
    option = (
        '<label><input type="checkbox" name="omit_amr"> Do not report the second factor</label>'
        if elevate
        else '<label><input type="checkbox" name="skip_mfa"> Sign in without a second factor</label>'
    )
    alert = f'<p role="alert">{html.escape(error)}</p>' if error else ""
    title = "Verify it's you" if elevate else "Sign in"
    return f"""<!doctype html><html><head><title>{title}</title></head><body><main>
<h1>{title}</h1>{alert}
<form method="post" action="/authorize">{hidden}
{email}<label>Code <input name="code" inputmode="numeric" autocomplete="one-time-code"></label>
{option}
<button name="action" value="verify">Continue</button>
<button name="action" value="cancel" formnovalidate>Cancel</button>
</form></main></body></html>"""


class Auth0:
    def __init__(self, issuer, client_id, client_secret, sign):
        self.issuer = issuer
        self.client_id = client_id
        self.client_secret = client_secret
        self.sign = sign
        self.lock = threading.Lock()
        self.codes = {}
        self.sessions = {}
        self.management_tokens = set()
        self.authenticators = {}

    def issue_code(self, email, mfa, enroll):
        code = secrets.token_urlsafe(24)
        with self.lock:
            self.codes[code] = {"email": email, "mfa": mfa}
            if mfa:
                methods = self.authenticators.setdefault(user_id(email), [])
                if enroll or not methods:
                    methods.append({"id": f"totp|{secrets.token_hex(8)}", "type": "totp", "name": "Authenticator"})
        return code

    def start_session(self, email):
        """Like Auth0's own session cookie: a step-up later knows the user without asking for the email."""
        session = secrets.token_urlsafe(24)
        with self.lock:
            self.sessions[session] = email
        return session

    def session_email(self, session):
        with self.lock:
            return self.sessions.get(session)

    def redeem(self, code):
        with self.lock:
            return self.codes.pop(code, None)

    def management_token(self):
        token = secrets.token_urlsafe(24)
        with self.lock:
            self.management_tokens.add(token)
        return token

    def is_management_token(self, header):
        token = header.removeprefix("Bearer ") if header else ""
        with self.lock:
            return token in self.management_tokens

    def authentication_methods(self, user):
        with self.lock:
            return list(self.authenticators.get(user, []))

    def delete_authentication_method(self, user, method_id):
        with self.lock:
            methods = self.authenticators.get(user, [])
            remaining = [method for method in methods if method["id"] != method_id]
            self.authenticators[user] = remaining
            return len(remaining) != len(methods)


def submit_authorize(form, headers, auth0):
    redirect_uri, state = form.get("redirect_uri", ""), form.get("state", "")
    if not redirect_uri.startswith(("http://", "https://")):
        return html_response(400, "<p>Missing redirect_uri</p>")
    if form.get("action") == "cancel":
        return redirect(redirect_uri, {**CANCELLED, "state": state})
    if form.get("code") != CODE:
        return html_response(200, form_page(form, "Wrong code. Try again."))
    if form.get("acr_values") == MFA_ACR:
        email = auth0.session_email(cookie_value(headers.get("cookie"), SESSION_COOKIE))
        if email is None:
            return html_response(200, form_page(form, "Your session has expired. Sign in again."))
        code = auth0.issue_code(email, not form.get("omit_amr"), form.get("ext-enroll-otp") == "true")
        return redirect(redirect_uri, {"code": code, "state": state})
    email = form.get("email", "")
    if "@" not in email:
        return html_response(200, form_page(form, "Enter an email address."))
    code = auth0.issue_code(email, not form.get("skip_mfa"), False)
    cookie = f"{SESSION_COOKIE}={auth0.start_session(email)}; Path=/; Secure; HttpOnly; SameSite=Lax"
    return redirect(redirect_uri, {"code": code, "state": state}, {"Set-Cookie": cookie})


def exchange_token(form, auth0):
    if form.get("client_id") != auth0.client_id or form.get("client_secret") != auth0.client_secret:
        return json_response(401, {"error": "access_denied", "error_description": "Unauthorized"})
    if form.get("grant_type") == "client_credentials":
        return json_response(200, {"access_token": auth0.management_token(), "expires_in": 86400, "token_type": "Bearer"})
    if form.get("grant_type") != "authorization_code":
        return json_response(400, {"error": "unsupported_grant_type"})
    grant = auth0.redeem(form.get("code", ""))
    if grant is None:
        return json_response(403, {"error": "invalid_grant", "error_description": "Invalid authorization code"})
    now = int(time.time())
    return json_response(200, {
        "access_token": secrets.token_urlsafe(24),
        "id_token": id_token(auth0.issuer, auth0.client_id, grant["email"], grant["mfa"], auth0.sign, now),
        "token_type": "Bearer",
        "expires_in": TOKEN_LIFETIME_SECONDS,
    })


def management(method, path, headers, auth0):
    if not auth0.is_management_token(headers.get("authorization")):
        return json_response(401, {"message": "Invalid Management API token"})
    parts = path.removeprefix("/api/v2/users/").split("/")
    user = urllib.parse.unquote(parts[0])
    if method == "GET" and parts[1:] == ["authentication-methods"]:
        return json_response(200, auth0.authentication_methods(user))
    if method == "DELETE" and parts[1:2] == ["authentication-methods"] and len(parts) == 3:
        found = auth0.delete_authentication_method(user, urllib.parse.unquote(parts[2]))
        return (204, {}, b"") if found else json_response(404, {"message": "Authentication method not found"})
    return json_response(404, {"message": f"The local Auth0 does not support {method} {path}"})


def dispatch(method, path, query, form, headers, auth0, jwks):
    """Returns the status, headers and body for an Auth0 request; `headers` has lower-case names."""
    if method == "GET" and path == "/health":
        return json_response(200, {"ready": True})
    if method == "GET" and path == "/.well-known/jwks.json":
        return json_response(200, jwks)
    if method == "GET" and path == "/authorize":
        return html_response(200, form_page(query))
    if method == "POST" and path == "/authorize":
        return submit_authorize(form, headers, auth0)
    if method == "POST" and path == "/oauth/token":
        return exchange_token(form, auth0)
    if method == "GET" and path == "/v2/logout":
        return 302, {"Location": query.get("returnTo", "/")}, b""
    if path.startswith("/api/v2/users/"):
        return management(method, path, headers, auth0)
    return json_response(404, {"message": f"The local Auth0 does not support {method} {path}"})


def rs256(private_key_pem):
    """Signs with the mock's RSA key; pycryptodome ships with the Transaction Service image (via web3)."""
    from Crypto.Hash import SHA256
    from Crypto.PublicKey import RSA
    from Crypto.Signature import pkcs1_15

    key = RSA.import_key(private_key_pem)
    sign = lambda message: pkcs1_15.new(key).sign(SHA256.new(message))  # noqa: E731
    public = {
        "kty": "RSA",
        "kid": KEY_ID,
        "use": "sig",
        "alg": "RS256",
        "n": base64url(key.n.to_bytes((key.n.bit_length() + 7) // 8, "big")),
        "e": base64url(key.e.to_bytes((key.e.bit_length() + 7) // 8, "big")),
    }
    return sign, {"keys": [public]}


def serve():
    issuer = f"https://{os.environ['AUTH0_DOMAIN']}/"
    sign, jwks = rs256((KEYS_DIR / "auth0-signing-key.pem").read_bytes())
    auth0 = Auth0(issuer, os.environ["AUTH0_CLIENT_ID"], os.environ["AUTH0_CLIENT_SECRET"], sign)

    class Handler(BaseHTTPRequestHandler):
        def respond(self, method):
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length).decode() if length else ""
            path, _, query = self.path.partition("?")
            params = dict(urllib.parse.parse_qsl(query))
            form = dict(urllib.parse.parse_qsl(raw))
            status, headers, body = dispatch(method, path, params, form, {k.lower(): v for k, v in self.headers.items()}, auth0, jwks)
            self.send_response(status)
            for name, value in headers.items():
                self.send_header(name, value)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            self.respond("GET")

        def do_POST(self):
            self.respond("POST")

        def do_DELETE(self):
            self.respond("DELETE")

        def log_message(self, *_args):
            pass

    server = ThreadingHTTPServer(("0.0.0.0", 443), Handler)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    context.load_cert_chain(KEYS_DIR / "tls-cert.pem", KEYS_DIR / "tls-key.pem")
    server.socket = context.wrap_socket(server.socket, server_side=True)
    print(f"Local Auth0 for {issuer}", file=sys.stderr, flush=True)
    server.serve_forever()


if __name__ == "__main__":
    serve()
