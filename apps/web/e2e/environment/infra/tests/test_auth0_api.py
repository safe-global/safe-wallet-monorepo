import base64
import json
import unittest
import urllib.parse
from importlib.util import find_spec
from pathlib import Path

from scripts.auth0_api import CANCELLED, CODE, MFA_ACR, SESSION_COOKIE, Auth0, dispatch, rs256, user_id

ISSUER = "https://auth.safe-e2e.test/"
CLIENT = {"client_id": "client", "client_secret": "secret"}
CALLBACK = "http://localhost:8000/cgw/v1/auth/oidc/callback"
EMAIL = "admin@safe-e2e.test"
COMPOSE = (Path(__file__).parents[1] / "docker-compose.test.yml").read_text()


def claims(token):
    payload = token.split(".")[1]
    return json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))


def query(location):
    return dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(location).query))


class Auth0MockTest(unittest.TestCase):
    def setUp(self):
        self.auth0 = Auth0(ISSUER, CLIENT["client_id"], CLIENT["client_secret"], lambda message: b"signature")

    def request(self, method, path, query_params=None, form=None, headers=None):
        return dispatch(method, path, query_params or {}, form or {}, headers or {}, self.auth0, {"keys": []})

    def submit(self, headers=None, **fields):
        form = {"redirect_uri": CALLBACK, "state": "state-1", "action": "verify", **fields}
        return self.request("POST", "/authorize", form=form, headers=headers)

    def sign_in(self, **fields):
        status, headers, _ = self.submit(email=EMAIL, code=CODE, **fields)
        self.assertEqual(status, 302)
        session = headers["Set-Cookie"].split(";")[0]
        return query(headers["Location"])["code"], {"cookie": session}

    def exchange(self, code):
        status, _, body = self.request(
            "POST", "/oauth/token", form={"grant_type": "authorization_code", "code": code, **CLIENT}
        )
        return status, json.loads(body)

    def management_token(self):
        _, _, body = self.request("POST", "/oauth/token", form={"grant_type": "client_credentials", **CLIENT})
        return {"authorization": f"Bearer {json.loads(body)['access_token']}"}

    def test_asks_for_the_email_only_at_sign_in(self):
        _, _, sign_in = self.request("GET", "/authorize", {"redirect_uri": CALLBACK, "state": "s"})
        _, _, step_up = self.request("GET", "/authorize", {"redirect_uri": CALLBACK, "acr_values": MFA_ACR})
        self.assertIn(b'name="email"', sign_in)
        self.assertIn(b"Sign in without a second factor", sign_in)
        self.assertNotIn(b'name="email"', step_up)
        self.assertIn(b"Do not report the second factor", step_up)

    def test_shows_an_error_for_a_wrong_code_and_issues_nothing(self):
        status, _, body = self.submit(email=EMAIL, code="000000")
        self.assertEqual(status, 200)
        self.assertIn(b'role="alert">Wrong code. Try again.', body)
        self.assertEqual(self.auth0.codes, {})

    def test_returns_the_documented_cancellation_with_the_state(self):
        status, headers, _ = self.submit(action="cancel")
        self.assertEqual(status, 302)
        self.assertEqual(query(headers["Location"]), {**CANCELLED, "state": "state-1"})

    def test_signs_in_with_a_verified_email_and_a_second_factor(self):
        code, _ = self.sign_in()
        status, body = self.exchange(code)
        self.assertEqual(status, 200)
        self.assertEqual(body["token_type"], "Bearer")
        token = claims(body["id_token"])
        self.assertEqual(token["iss"], ISSUER)
        self.assertEqual(token["aud"], "client")
        self.assertEqual(token["sub"], user_id(EMAIL))
        self.assertEqual((token["email"], token["email_verified"], token["amr"]), (EMAIL, True, ["mfa"]))

    def test_redeems_each_code_once(self):
        code, _ = self.sign_in()
        self.assertEqual(self.exchange(code)[0], 200)
        self.assertEqual(self.exchange(code)[0], 403)

    def test_signs_in_without_amr_when_the_second_factor_is_skipped(self):
        code, _ = self.sign_in(skip_mfa="on")
        self.assertNotIn("amr", claims(self.exchange(code)[1]["id_token"]))

    def test_steps_up_the_user_of_the_auth0_session(self):
        _, session = self.sign_in(skip_mfa="on")
        status, headers, _ = self.submit(headers=session, acr_values=MFA_ACR, code=CODE)
        self.assertEqual(status, 302)
        token = claims(self.exchange(query(headers["Location"])["code"])[1]["id_token"])
        self.assertEqual((token["email"], token["amr"]), (EMAIL, ["mfa"]))

    def test_leaves_amr_out_of_a_step_up_on_request(self):
        _, session = self.sign_in()
        _, headers, _ = self.submit(headers=session, acr_values=MFA_ACR, code=CODE, omit_amr="on")
        self.assertNotIn("amr", claims(self.exchange(query(headers["Location"])["code"])[1]["id_token"]))

    def test_refuses_a_step_up_without_an_auth0_session(self):
        status, headers, body = self.submit(headers={"cookie": f"{SESSION_COOKIE}=unknown"}, acr_values=MFA_ACR, code=CODE)
        self.assertEqual(status, 200)
        self.assertNotIn("Location", headers)
        self.assertIn(b"Your session has expired", body)

    def test_rejects_unknown_client_credentials(self):
        status, _, _ = self.request("POST", "/oauth/token", form={"grant_type": "client_credentials", "client_id": "x"})
        self.assertEqual(status, 401)

    def test_lists_enrolls_and_deletes_authenticators(self):
        path = f"/api/v2/users/{urllib.parse.quote(user_id(EMAIL))}/authentication-methods"
        self.assertEqual(self.request("GET", path)[0], 401)
        _, session = self.sign_in()
        token = self.management_token()
        methods = json.loads(self.request("GET", path, headers=token)[2])
        self.assertEqual([method["type"] for method in methods], ["totp"])
        self.submit(headers=session, acr_values=MFA_ACR, code=CODE, **{"ext-enroll-otp": "true"})
        methods = json.loads(self.request("GET", path, headers=token)[2])
        self.assertEqual(len(methods), 2)
        self.assertEqual(self.request("DELETE", f"{path}/{methods[0]['id']}", headers=token)[0], 204)
        self.assertEqual(self.request("DELETE", f"{path}/{methods[0]['id']}", headers=token)[0], 404)
        self.assertEqual(len(json.loads(self.request("GET", path, headers=token)[2])), 1)

    def test_returns_from_logout(self):
        status, headers, _ = self.request("GET", "/v2/logout", {"returnTo": "http://localhost:3080/welcome"})
        self.assertEqual((status, headers["Location"]), (302, "http://localhost:3080/welcome"))

    def test_gateway_trusts_the_shared_certificate_and_reaches_the_mock_by_its_domain(self):
        for expected in ("AUTH0_DOMAIN: auth.safe-e2e.test", "NODE_EXTRA_CA_CERTS: /mock-keys/tls-cert.pem",
                         "- auth.safe-e2e.test", "DNS:api.cow.fi,DNS:auth.safe-e2e.test"):
            self.assertTrue(expected in COMPOSE, f"docker-compose.test.yml lacks {expected}")

    @unittest.skipUnless(find_spec("Crypto"), "pycryptodome is only in the Transaction Service image")
    def test_signs_rs256_with_the_published_key(self):
        from Crypto.Hash import SHA256
        from Crypto.PublicKey import RSA
        from Crypto.Signature import pkcs1_15

        key = RSA.generate(2048)
        sign, jwks = rs256(key.export_key())
        published = jwks["keys"][0]
        n = int.from_bytes(base64.urlsafe_b64decode(published["n"] + "=" * (-len(published["n"]) % 4)), "big")
        message = b"header.payload"
        pkcs1_15.new(RSA.construct((n, key.e))).verify(SHA256.new(message), sign(message))


if __name__ == "__main__":
    unittest.main()
