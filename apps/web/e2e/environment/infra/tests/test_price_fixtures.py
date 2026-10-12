import unittest
from scripts.price_fixtures import fixture_response


class PriceFixturesTest(unittest.TestCase):
    def test_native_prices_and_supported_currencies(self):
        self.assertEqual(fixture_response("/simple/supported_vs_currencies"), (200, ["usd", "eur"]))
        self.assertEqual(fixture_response("/simple/price?ids=ethereum&vs_currencies=usd,eur"),
                         (200, {"ethereum": {"usd": 2000, "usd_24h_change": 0, "eur": 1800, "eur_24h_change": 0}}))

    def test_each_forked_native_coin_has_its_own_price(self):
        self.assertEqual(
            fixture_response("/simple/price?ids=ethereum,polygon-ecosystem-token&vs_currencies=usd"),
            (200, {"ethereum": {"usd": 2000, "usd_24h_change": 0},
                   "polygon-ecosystem-token": {"usd": 0.5, "usd_24h_change": 0}}),
        )

    def test_unknown_tokens_stay_unpriced(self):
        self.assertEqual(fixture_response("/simple/token_price/ethereum?contract_addresses=0x123"), (200, {}))
        self.assertEqual(fixture_response("/simple/price?ids=unknown&vs_currencies=usd"), (200, {}))

    def test_unknown_requests_fail_explicitly(self):
        self.assertEqual(fixture_response("/simple/price?ids=ethereum&vs_currencies=unknown")[0], 400)
        self.assertEqual(fixture_response("/unsupported")[0], 404)
