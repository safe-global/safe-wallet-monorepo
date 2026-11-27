import os
from tempfile import TemporaryDirectory
from unittest.mock import Mock, patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from django_celery_beat.models import IntervalSchedule, PeriodicTask
from safe_transaction_service.history.models import IndexingStatus, ProxyFactory, SafeMasterCopy
from safe_transaction_service.contracts.models import Contract, ContractQuerySet
from safe_transaction_service.history.models import MultisigTransaction


MODULE = "safe_transaction_service.history.management.commands.setup_fork_indexing"
SINGLETON = "0x29fcB43b46531BcA003ddC8FCB67FFE91900C762"
FACTORY = "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67"
EXTRA = "0x41675C099F32341bf84BFc5382aF534df5C7461a"


class BootstrapTests(TestCase):
    def setUp(self):
        self.settings_override = self.settings(ETH_L2_NETWORK=True, ETH_EVENTS_BLOCKS_TO_REINDEX_AGAIN=0)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.env = patch.dict(
            os.environ, {"FORK_BLOCK_NUMBER": "100", "FORK_CHAIN_ID": "11155111", "FORK_BLOCK_HASH": ""},
        )
        self.env.start()
        self.addCleanup(self.env.stop)
        client = Mock()
        client.get_chain_id.return_value = 11155111
        client.w3.eth.get_block.return_value = {"hash": bytes.fromhex("ab" * 32)}
        client.w3.eth.get_code.return_value = b"contract"
        self.client = client
        for name, replacement in (("get_auto_ethereum_client", Mock(return_value=client)), ("call_command", Mock())):
            patcher = patch(f"{MODULE}.{name}", replacement)
            patcher.start()
            self.addCleanup(patcher.stop)
        SafeMasterCopy.objects.create(
            address=SINGLETON, version="1.4.1+L2", l2=True, initial_block_number=1, tx_block_number=5,
        )
        ProxyFactory.objects.create(address=FACTORY, initial_block_number=2, tx_block_number=6)

    def test_preserves_metadata_and_registers_additional_deployments(self):
        call_command("setup_fork_indexing")
        singleton = SafeMasterCopy.objects.get(address=SINGLETON)
        self.assertEqual(singleton.version, "1.4.1+L2")
        self.assertTrue(singleton.l2)
        self.assertEqual(singleton.tx_block_number, 100)
        self.assertTrue(SafeMasterCopy.objects.filter(address=EXTRA, l2=False).exists())
        self.assertGreater(SafeMasterCopy.objects.count(), 3)
        self.assertGreater(ProxyFactory.objects.count(), 3)
        self.assertEqual(IndexingStatus.objects.get().block_number, 100)

    def test_bundled_catalog_registers_safe_150_without_supplements(self):
        call_command("setup_fork_indexing")
        self.assertTrue(SafeMasterCopy.objects.filter(version="1.5.0", l2=False).exists())
        self.assertTrue(SafeMasterCopy.objects.filter(version="1.5.0+L2", l2=True).exists())
        self.assertTrue(ProxyFactory.objects.filter(address="0x14F2982D601c9458F93bd70B218933A6f8165e7b").exists())

    def test_rerun_preserves_forward_progress(self):
        call_command("setup_fork_indexing")
        SafeMasterCopy.objects.filter(address=SINGLETON).update(tx_block_number=120)
        ProxyFactory.objects.filter(address=FACTORY).update(tx_block_number=130)
        IndexingStatus.objects.update(block_number=140)
        call_command("setup_fork_indexing")
        self.assertEqual(SafeMasterCopy.objects.get(address=SINGLETON).tx_block_number, 120)
        self.assertEqual(ProxyFactory.objects.get(address=FACTORY).tx_block_number, 130)
        self.assertEqual(IndexingStatus.objects.get().block_number, 140)

    def test_check_rejects_a_cursor_below_fork(self):
        call_command("setup_fork_indexing")
        ProxyFactory.objects.filter(address=FACTORY).update(tx_block_number=0)
        with self.assertRaisesRegex(CommandError, "escapes fork boundary"):
            call_command("setup_fork_indexing", check=True)

    def test_wrong_chain_fails_without_changing_registry(self):
        self.client.get_chain_id.return_value = 1
        with self.assertRaisesRegex(CommandError, "chain ID"):
            call_command("setup_fork_indexing")
        self.assertEqual(SafeMasterCopy.objects.get(address=SINGLETON).tx_block_number, 5)

    def test_missing_registered_contract_rolls_back(self):
        self.client.w3.eth.get_code.return_value = b""
        with self.assertRaisesRegex(CommandError, "does not exist"):
            call_command("setup_fork_indexing")
        self.assertEqual(ProxyFactory.objects.get(address=FACTORY).initial_block_number, 2)

    def test_zero_block_is_rejected(self):
        with self.assertRaisesRegex(CommandError, "positive"):
            call_command("setup_fork_indexing", fork_block=0)

    def test_only_historical_reindex_tasks_are_disabled(self):
        interval = IntervalSchedule.objects.create(every=1, period=IntervalSchedule.MINUTES)
        reindex = PeriodicTask.objects.create(
            name="historical", task="history.tasks.reindex_erc20_events", interval=interval,
        )
        indexing = PeriodicTask.objects.create(
            name="live", task="history.tasks.index_erc20_events", interval=interval,
        )
        call_command("setup_fork_indexing")
        reindex.refresh_from_db()
        indexing.refresh_from_db()
        self.assertFalse(reindex.enabled)
        self.assertTrue(indexing.enabled)

    def test_safe_and_token_event_indexing_runs_every_second(self):
        for task, every in (("index_safe_events_task", 5), ("index_erc20_events_task", 14)):
            interval = IntervalSchedule.objects.create(every=every, period=IntervalSchedule.SECONDS)
            PeriodicTask.objects.create(
                name=task, task=f"safe_transaction_service.history.tasks.{task}", interval=interval,
            )
        call_command("setup_fork_indexing")
        intervals = {
            (task.interval.every, task.interval.period)
            for task in PeriodicTask.objects.filter(name__in=("index_safe_events_task", "index_erc20_events_task"))
        }
        self.assertEqual(intervals, {(1, IntervalSchedule.SECONDS)})

    def test_catalog_entries_absent_at_fork_are_not_registered(self):
        self.client.w3.eth.get_code.side_effect = (
            lambda address, block_identifier: b"" if address == EXTRA else b"contract"
        )
        call_command("setup_fork_indexing")
        self.assertFalse(SafeMasterCopy.objects.filter(address=EXTRA).exists())
        self.assertTrue(SafeMasterCopy.objects.filter(address=SINGLETON).exists())

    def test_wrong_fork_hash_fails_without_advancing_cursors(self):
        with patch.dict(os.environ, {"FORK_BLOCK_HASH": "0x" + "cd" * 32}):
            with self.assertRaisesRegex(CommandError, "FORK_BLOCK_HASH"):
                call_command("setup_fork_indexing")
        self.assertEqual(ProxyFactory.objects.get(address=FACTORY).tx_block_number, 6)


class ContractCatalogTests(TestCase):
    def test_bundled_contract_setup_trusts_multisend_without_moving_indexers(self):
        trust_cache = ContractQuerySet.cache_trusted_addresses_for_delegate_call
        trust_cache.clear()
        self.addCleanup(trust_cache.clear)
        address = "0x9641d764fc13c8B624c04430C7356C1C7C8102e2"
        transaction = MultisigTransaction(to=address, operation=1)
        untrusted = MultisigTransaction(to="0x0000000000000000000000000000000000000001", operation=1)
        self.assertFalse(transaction.data_should_be_decoded())
        ProxyFactory.objects.create(address=FACTORY, initial_block_number=100, tx_block_number=120)
        client = Mock()
        client.get_chain_id.return_value = 11155111
        with TemporaryDirectory() as media, self.settings(MEDIA_ROOT=media), patch(
            "safe_transaction_service.contracts.management.commands.setup_safe_contracts.get_auto_ethereum_client",
            return_value=client,
        ):
            call_command("setup_safe_contracts", safe_version="1.4.1")
        trust_cache.clear()
        self.assertTrue(transaction.data_should_be_decoded())
        self.assertFalse(untrusted.data_should_be_decoded())
        self.assertEqual(Contract.objects.get(address=address).display_name, "Safe: MultiSendCallOnly 1.4.1")
        self.assertEqual(ProxyFactory.objects.get(address=FACTORY).tx_block_number, 120)
