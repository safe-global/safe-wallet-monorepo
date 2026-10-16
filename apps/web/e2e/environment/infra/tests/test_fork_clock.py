import unittest

from scripts.align_fork_clock import SYSTEM_CONTRACTS, align_fork_clock, disable_system_contracts

FORK_BLOCK = 50
NOW = 100


class FakeAnvil:
    """Answers the clock RPCs by method; `mine_advances` and `mine_hash` model faulty nodes."""

    def __init__(self, client="anvil/v1.8.3", chain_id="0xaa", anchor="0xabc", latest=1):
        self.client, self.chain_id, self.anchor, self.latest = client, chain_id, anchor, latest
        self.mine_advances = True
        self.mine_hash = anchor
        self.next_timestamp = None
        self.calls = []

    def __call__(self, method, params):
        self.calls.append((method, params))
        return getattr(self, method)(*params)

    def web3_clientVersion(self):
        return self.client

    def eth_chainId(self):
        return self.chain_id

    def eth_getBlockByNumber(self, block, _full):
        if block == "latest":
            return {"timestamp": hex(self.latest)}
        return {"hash": self.anchor} if block == hex(FORK_BLOCK) else None

    def evm_setNextBlockTimestamp(self, timestamp):
        self.next_timestamp = timestamp

    def evm_mine(self):
        if self.mine_advances:
            self.latest = self.next_timestamp
        self.anchor = self.mine_hash

    def anvil_setCode(self, address, code):
        pass

    def mutations(self):
        return [call for call in self.calls if call[0].startswith("evm_")]


class ForkClockTests(unittest.TestCase):
    def test_advances_old_blocks_without_changing_fork_anchor(self):
        anvil = FakeAnvil(latest=1)
        align_fork_clock(anvil, 170, FORK_BLOCK, "0xabc", NOW)
        self.assertEqual(anvil.latest, NOW)
        self.assertEqual(anvil.anchor, "0xabc")

    def test_preserves_future_clock_for_time_travel_scenarios(self):
        anvil = FakeAnvil(latest=200)
        align_fork_clock(anvil, 170, FORK_BLOCK, "0xabc", NOW)
        self.assertEqual(anvil.mutations(), [])
        self.assertEqual(anvil.latest, 200)

    def test_rejects_wrong_node_chain_or_fork_before_mutating(self):
        for anvil in (FakeAnvil(client="geth"), FakeAnvil(chain_id="0x1"), FakeAnvil(anchor="0xdef")):
            with self.subTest(client=anvil.client, chain=anvil.chain_id, anchor=anvil.anchor):
                with self.assertRaises(RuntimeError):
                    align_fork_clock(anvil, 170, FORK_BLOCK, "0xabc", NOW)
                self.assertEqual(anvil.mutations(), [])

    def test_rejects_failed_alignment_or_changed_anchor(self):
        stuck = FakeAnvil()
        stuck.mine_advances = False
        reorged = FakeAnvil()
        reorged.mine_hash = "0xdef"
        for anvil, message in ((stuck, "did not advance"), (reorged, "changed the fork anchor")):
            with self.subTest(message=message), self.assertRaisesRegex(RuntimeError, message):
                align_fork_clock(anvil, 170, FORK_BLOCK, "0xabc", NOW)

    def test_removes_code_of_every_system_contract(self):
        anvil = FakeAnvil()
        disable_system_contracts(anvil)
        cleared = {params[0] for method, params in anvil.calls if method == "anvil_setCode"}
        self.assertEqual(cleared, set(SYSTEM_CONTRACTS))
        self.assertTrue(all(params[1] == "0x" for _, params in anvil.calls))
