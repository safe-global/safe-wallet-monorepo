import os

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import F, Value
from django.db.models.functions import Coalesce, Greatest
from django_celery_beat.models import IntervalSchedule, PeriodicTask
from safe_eth.eth import get_auto_ethereum_client
from safe_eth.safe.addresses import (
    get_default_addresses_with_version,
    safe_proxy_factory_contract_names,
    safe_singleton_contract_names,
)
from safe_transaction_service.history.models import (
    IndexingStatus,
    IndexingStatusType,
    ProxyFactory,
    SafeMasterCopy,
)


# Scenarios wait for these after each change; the defaults of 5 s and 14 s dominated that wait.
FAST_INDEXING_TASKS = (
    "safe_transaction_service.history.tasks.index_safe_events_task",
    "safe_transaction_service.history.tasks.index_erc20_events_task",
)


def fork_settings(options):
    try:
        raw_block = options.get("fork_block")
        fork_block = int(raw_block if raw_block is not None else os.environ["FORK_BLOCK_NUMBER"])
        chain_id = int(os.environ["FORK_CHAIN_ID"])
    except (KeyError, ValueError) as exc:
        raise CommandError("FORK_BLOCK_NUMBER and FORK_CHAIN_ID must be integers") from exc
    if fork_block <= 0:
        raise CommandError("Fork block must be positive")
    if not settings.ETH_L2_NETWORK or settings.ETH_EVENTS_BLOCKS_TO_REINDEX_AGAIN:
        raise CommandError("Fork profile requires L2 indexing and zero event lookback")
    return fork_block, chain_id


def verify_fork(client, fork_block, chain_id):
    if client.get_chain_id() != chain_id:
        raise CommandError("RPC chain ID does not match FORK_CHAIN_ID")
    block_hash = client.w3.eth.get_block(fork_block)["hash"].hex()
    expected_hash = os.environ.get("FORK_BLOCK_HASH", "").removeprefix("0x")
    if expected_hash and block_hash.removeprefix("0x") != expected_hash:
        raise CommandError("RPC fork block does not match FORK_BLOCK_HASH")


def verify_deployments(fork_block):
    for model in (SafeMasterCopy, ProxyFactory):
        if not model.objects.exists():
            raise CommandError(f"No {model.__name__} deployments registered")
        if (
            model.objects.exclude(initial_block_number=fork_block).exists()
            or model.objects.filter(tx_block_number__lt=fork_block).exists()
            or model.objects.filter(tx_block_number__isnull=True).exists()
        ):
            raise CommandError(f"{model.__name__} indexing escapes fork boundary")


def verify_indexing_tasks(fork_block):
    if not IndexingStatus.objects.filter(
        indexing_type=IndexingStatusType.ERC20_721_EVENTS.value,
        block_number__gte=fork_block,
    ).exists():
        raise CommandError("Transfer indexing escapes fork boundary")
    if PeriodicTask.objects.filter(task__contains=".reindex_", enabled=True).exists():
        raise CommandError("Historical reindex tasks must be disabled")
    slow = PeriodicTask.objects.filter(task__in=FAST_INDEXING_TASKS).exclude(
        interval__every=1, interval__period=IntervalSchedule.SECONDS
    )
    if slow.exists():
        raise CommandError("Safe and token event indexing must run every second")


class Command(BaseCommand):
    help = "Register deployed Safe contracts and bound indexing to an isolated fork"

    def add_arguments(self, parser):
        parser.add_argument("--fork-block", type=int)
        parser.add_argument("--check", action="store_true")

    def handle(self, *args, **options):
        fork_block, chain_id = fork_settings(options)
        client = get_auto_ethereum_client()
        verify_fork(client, fork_block, chain_id)
        if not options["check"]:
            with transaction.atomic():
                self.bootstrap(client, fork_block)
        verify_deployments(fork_block)
        verify_indexing_tasks(fork_block)
        self.stdout.write(self.style.SUCCESS(
            f"Fork boundary {fork_block}: {SafeMasterCopy.objects.count()} singletons, "
            f"{ProxyFactory.objects.count()} factories; indexing verified"
        ))

    def bootstrap(self, client, fork_block):
        call_command("setup_service")
        call_command("setup_safe_contracts")
        self.register_deployments(client, fork_block)
        for model in (SafeMasterCopy, ProxyFactory):
            model.objects.update(
                initial_block_number=fork_block,
                tx_block_number=Greatest(Coalesce(F("tx_block_number"), Value(0)), Value(fork_block)),
            )
        status, _ = IndexingStatus.objects.get_or_create(
            indexing_type=IndexingStatusType.ERC20_721_EVENTS.value,
            defaults={"block_number": fork_block},
        )
        if status.block_number < fork_block:
            status.block_number = fork_block
            status.save(update_fields=["block_number"])
        PeriodicTask.objects.filter(task__contains=".reindex_").update(enabled=False)
        every_second, _ = IntervalSchedule.objects.get_or_create(every=1, period=IntervalSchedule.SECONDS)
        # Save each task, because a bulk update does not tell the beat scheduler about the change.
        for task in PeriodicTask.objects.filter(task__in=FAST_INDEXING_TASKS):
            task.interval = every_second
            task.save(update_fields=["interval"])

    def register_deployments(self, client, fork_block):
        catalogs = (
            (SafeMasterCopy, safe_singleton_contract_names),
            (ProxyFactory, safe_proxy_factory_contract_names),
        )
        for model, names in catalogs:
            for address, version in get_default_addresses_with_version(names):
                if not client.w3.eth.get_code(address, block_identifier=fork_block):
                    continue
                defaults = {"initial_block_number": fork_block, "tx_block_number": fork_block}
                if model is SafeMasterCopy:
                    defaults.update(version=version, l2=version.endswith("+L2"))
                model.objects.get_or_create(address=address, defaults=defaults)
            for entry in model.objects.all():
                if not client.w3.eth.get_code(entry.address, block_identifier=fork_block):
                    raise CommandError(
                        f"Registered deployment {entry.address} does not exist at fork block {fork_block}"
                    )
