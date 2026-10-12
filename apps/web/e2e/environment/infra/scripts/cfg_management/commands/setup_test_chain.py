"""Configures a forked chain in the config service; docker-compose.test.yml mounts it there."""

import io
import os

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from PIL import Image

from chains.models import Chain, Feature, GasPrice, Service, Wallet
from safe_apps.models import SafeApp


def create_placeholder_image(color: str = "#B8AAF8") -> ContentFile:
    """Create a simple 64x64 placeholder image."""
    img = Image.new("RGB", (64, 64), color)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return ContentFile(buffer.getvalue(), name="currency_logo.png")


# Staging Sepolia features for WALLET_WEB, which the existing Cypress specs expect.
# Left out: SECURITY_HUB stalls transaction signing in the local stack.
DEFAULT_FEATURES = [
    "ADDRESS_POISONING_PROTECTION",
    "BATCHING",
    "BRIDGE",
    "CLASSIC_VIEW",
    "COUNTERFACTUAL",
    "CSV_TX_EXPORT",
    "DEFAULT_TOKENLIST",
    "DELETE_TX",
    "DOMAIN_LOOKUP",
    "EIP1271",
    "EIP1559",
    "ERC721",
    "HYPERNATIVE",
    "HYPERNATIVE_QUEUE_SCAN",
    "LENDING",
    "MASS_PAYOUTS",
    "MIXPANEL",
    "MULTI_CHAIN_SAFE_ADD_NETWORK",
    "MULTI_CHAIN_SAFE_CREATION",
    "MY_ACCOUNTS",
    "NATIVE_SWAPS",
    "NATIVE_SWAPS_COW",
    "NATIVE_SWAPS_FEE_ENABLED",
    "NATIVE_WALLETCONNECT",
    "NESTED_SAFES",
    "OIDC_AUTH",
    "POLICIES",
    "POLICY_INDEXER_SPENDING_LIMIT",
    "PRIVATE_ADDRESS_BOOK",
    "PROPOSERS",
    "PROPOSER_GATING",
    "PUSH_NOTIFICATIONS",
    "RECOVERY",
    "RELAYING",
    "RISK_MITIGATION",
    "SAFE_APPS",
    "SAFE_PRO",
    "SAFE_PRO_ANNOUNCEMENT",
    "SAFE_STAKING",
    "SPACES",
    "SPACE_AUDIT_LOG",
    "SPACE_ONBOARDING_SURVEY",
    "SPEED_UP_TX",
    "SPENDING_LIMIT",
    "SPENDING_LIMIT_GATING",
    "STAKING",
    "STAKING_PROMO",
    "SWITCH_AUTHENTICATOR",
    "TWO_FACTOR_AWARENESS_BANNER",
    "TX_NOTES",
    "TX_SIMULATION",
    "WELCOME_ACCOUNTS_REDESIGN",
    "ZODIAC_ROLES",
]

DEFAULT_WALLETS = [
    "coinbase",
    "injected",
    "keystone",
    "ledger",
    "pk",
    "safeMobile",
    "trezor",
    "walletConnect_v2",
]


SAFE_APPS = [
    (
        "http://localhost:4000",
        "Transaction Builder",
        "Compose custom contract interactions and batch them into a single transaction",
        True,
    ),
    # Not in this repository, so the hosted app is listed, as on staging.
    (
        "https://safe-apps.dev.5afe.dev/drain-safe",
        "Drain Account",
        "Transfer all your assets in batch",
        False,
    ),
    ("https://swap.cow.fi", "CowSwap", "Trade tokens", True),
]
NO_AUTHENTICATION = Chain.RpcAuthentication.NO_AUTHENTICATION


def explorer_templates() -> dict:
    explorer = os.environ.get("TEST_CHAIN_EXPLORER", "https://sepolia.etherscan.io")
    explorer_api = os.environ.get(
        "TEST_CHAIN_EXPLORER_API", "https://api-sepolia.etherscan.io/api"
    )
    query = (
        "module={{module}}&action={{action}}&address={{address}}&apiKey={{apiKey}}"
    )
    return {
        "block_explorer_uri_address_template": f"{explorer}/address/{{{{address}}}}",
        "block_explorer_uri_tx_hash_template": f"{explorer}/tx/{{{{txHash}}}}",
        "block_explorer_uri_api_template": f"{explorer_api}?{query}",
    }


def rpc_settings(rpc_url: str) -> dict:
    return {
        "rpc_authentication": NO_AUTHENTICATION,
        "rpc_uri": rpc_url,
        "safe_apps_rpc_authentication": NO_AUTHENTICATION,
        "safe_apps_rpc_uri": rpc_url,
        "public_rpc_authentication": NO_AUTHENTICATION,
        "public_rpc_uri": rpc_url,
    }


def chain_defaults(chain_id: int, chain_name: str, rpc_url: str, txs_url: str) -> dict:
    return {
        "relevance": 1,
        "name": chain_name,
        "short_name": os.environ.get("TEST_CHAIN_SHORT_NAME", "sep"),
        "description": f"Forked test network (chain ID {chain_id})",
        "l2": True,
        "relayer_type": "DAILY_LIMIT",
        "relayer_safe_creation_sponsored": True,
        "relayer_safe_transaction_sponsored": True,
        # Staging lists SUBSCRIPTION and PAY_FROM_SAFE; existing relay specs need FREE_DAILY_LIMIT.
        "relayer_gas_payment_options": ["FREE_DAILY_LIMIT", "SUBSCRIPTION"],
        "is_testnet": os.environ.get("TEST_CHAIN_IS_TESTNET", "true") == "true",
        "zk": False,
        **rpc_settings(rpc_url),
        **explorer_templates(),
        "currency_name": os.environ.get("TEST_CHAIN_CURRENCY_NAME", "Sepolia Ether"),
        "currency_symbol": os.environ.get("TEST_CHAIN_CURRENCY_SYMBOL", "ETH"),
        "currency_decimals": 18,
        "prices_provider_native_coin": os.environ.get("TEST_CHAIN_PRICES_COIN", "ethereum"),
        "prices_provider_chain_name": os.environ.get("TEST_CHAIN_PRICES_CHAIN", "ethereum"),
        "transaction_service_uri": os.environ.get("TEST_PUBLIC_TXS_URL", txs_url),
        "vpc_transaction_service_uri": txs_url,
        "theme_text_color": "#ffffff",
        "theme_background_color": "#B8AAF8",
        "recommended_master_copy_version": "1.5.0",  # as on staging
        "hidden": False,
    }


class Command(BaseCommand):
    help = "Set up a test chain configuration for forked networks"

    def add_arguments(self, parser):
        parser.add_argument(
            "--chain-id",
            type=int,
            default=None,
            help="Chain ID. Defaults to FORK_CHAIN_ID env var.",
        )
        parser.add_argument(
            "--chain-name",
            type=str,
            default=os.environ.get("TEST_CHAIN_NAME", "Sepolia"),
            help="Chain display name",
        )
        parser.add_argument(
            "--rpc-url",
            type=str,
            default=None,
            help="RPC URL for the chain. Defaults to http://rpc.safe-e2e.test:8545",
        )
        parser.add_argument(
            "--txs-url",
            type=str,
            default=None,
            help="Transaction service URL. Defaults to http://nginx:8000/txs/",
        )

    def handle(self, *args, **options):
        chain_id = options["chain_id"] or os.environ.get("FORK_CHAIN_ID")
        if chain_id is None:
            raise CommandError(
                "Chain ID required. Use --chain-id or set FORK_CHAIN_ID env var."
            )
        chain_id = int(chain_id)
        rpc_url = options["rpc_url"] or os.environ.get(
            "TEST_RPC_URL", "http://rpc.safe-e2e.test:8545"
        )
        txs_url = options["txs_url"] or os.environ.get(
            "TEST_TXS_URL", "http://nginx:8000/txs/"
        )
        chain_name = options["chain_name"]

        self.stdout.write(f"Setting up test chain: {chain_name} (ID: {chain_id})")
        self.stdout.write(f"  RPC URL: {rpc_url}")
        self.stdout.write(f"  TXS URL: {txs_url}")
        chain = self._setup_chain(chain_id, chain_defaults(chain_id, chain_name, rpc_url, txs_url))
        self._setup_gas_price(chain)
        self._setup_features(chain)
        self._setup_wallets(chain)
        self._setup_safe_apps(chain)
        self.stdout.write(
            self.style.SUCCESS(f"Test chain {chain_name} configured successfully!")
        )

    def _setup_chain(self, chain_id: int, defaults: dict) -> Chain:
        chain, created = Chain.objects.update_or_create(id=chain_id, defaults=defaults)
        if created or not chain.currency_logo_uri:
            chain.currency_logo_uri.save(
                f"chains/{chain_id}/currency_logo.png",
                create_placeholder_image("#B8AAF8"),
                save=True,
            )
        if created or not chain.chain_logo_uri:
            chain.chain_logo_uri.save(
                f"chains/{chain_id}/chain_logo.png",
                create_placeholder_image("#12FF80"),
                save=True,
            )
        self.stdout.write(f"  {'Created' if created else 'Updated'} Chain {chain_id}")
        return chain

    def _setup_gas_price(self, chain: Chain):
        _, created = GasPrice.objects.update_or_create(
            chain=chain,
            oracle_uri=None,
            defaults={"fixed_wei_value": 1_000_000_000, "rank": 1},
        )
        self.stdout.write(f"  {'Created' if created else 'Updated'} GasPrice for chain {chain.id}")

    def _setup_features(self, chain: Chain):
        """Enable exactly the default features plus TEST_CHAIN_EXTRA_FEATURES for the chain."""
        extra = [key for key in os.environ.get("TEST_CHAIN_EXTRA_FEATURES", "").split(",") if key]
        features = DEFAULT_FEATURES + extra
        for feature in Feature.objects.filter(chains=chain).exclude(key__in=features):
            feature.chains.remove(chain)
        services = [
            Service.objects.get_or_create(key=key, defaults={"name": key})[0]
            for key in ("WALLET_WEB", "CGW")
        ]
        for feature_key in features:
            feature, _ = Feature.objects.get_or_create(
                key=feature_key,
                defaults={"description": f"Feature: {feature_key}"},
            )
            feature.chains.add(chain)
            feature.services.add(*services)
        self.stdout.write(f"  Enabled {len(features)} features")

    def _setup_wallets(self, chain: Chain):
        """Enable default wallets for the chain."""
        for wallet_key in DEFAULT_WALLETS:
            wallet, _ = Wallet.objects.get_or_create(key=wallet_key)
            wallet.chains.add(chain)
        self.stdout.write(f"  Enabled {len(DEFAULT_WALLETS)} wallets")

    def _setup_safe_apps(self, chain: Chain):
        for url, name, description, featured in SAFE_APPS:
            existing = SafeApp.objects.filter(url=url).first()
            # Each forked chain adds itself; replacing the list would hide the apps on other forks.
            chain_ids = sorted({*(existing.chain_ids if existing else []), chain.id})
            app, created = SafeApp.objects.update_or_create(
                url=url,
                defaults={
                    "name": name,
                    "description": description,
                    "chain_ids": chain_ids,
                    "listed": True,
                    "featured": featured,
                },
            )
            if created:
                app.icon_url.save("app.png", create_placeholder_image(), save=True)
