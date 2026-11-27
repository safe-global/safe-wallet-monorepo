import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SYSTEM_CONTRACTS, alignForkClock, disableSystemContracts } from './align-fork-clock.ts'
import type { Rpc } from './align-fork-clock.ts'

const FORK_BLOCK = 50
const NOW = 100
const FORK = { chainId: 170, forkBlock: FORK_BLOCK, forkHash: '0xabc', now: NOW }

type Call = [string, unknown[]]

/** Answers the clock RPCs; `mineAdvances` and `mineHash` model faulty nodes. */
class FakeAnvil {
  client = 'anvil/v1.8.3'
  chainId = '0xaa'
  anchor = '0xabc'
  latest = 1
  mineAdvances = true
  mineHash = '0xabc'
  nextTimestamp = 0
  readonly calls: Call[] = []

  constructor(overrides: Partial<Pick<FakeAnvil, 'client' | 'chainId' | 'anchor' | 'latest'>> = {}) {
    Object.assign(this, overrides)
  }

  readonly rpc: Rpc = async (method, params) => {
    this.calls.push([method, params])
    switch (method) {
      case 'web3_clientVersion':
        return this.client
      case 'eth_chainId':
        return this.chainId
      case 'eth_getBlockByNumber':
        if (params[0] === 'latest') return { timestamp: `0x${this.latest.toString(16)}` }
        return params[0] === `0x${FORK_BLOCK.toString(16)}` ? { hash: this.anchor } : null
      case 'evm_setNextBlockTimestamp':
        this.nextTimestamp = params[0] as number
        return null
      case 'evm_mine':
        if (this.mineAdvances) this.latest = this.nextTimestamp
        this.anchor = this.mineHash
        return null
      case 'anvil_setCode':
        return null
      default:
        throw new Error(`Unexpected RPC ${method}`)
    }
  }

  mutations(): Call[] {
    return this.calls.filter(([method]) => method.startsWith('evm_'))
  }
}

describe('fork clock alignment', () => {
  it('advances old blocks without changing the fork anchor', async () => {
    const anvil = new FakeAnvil({ latest: 1 })
    await alignForkClock(anvil.rpc, FORK)
    assert.equal(anvil.latest, NOW)
    assert.equal(anvil.anchor, '0xabc')
  })

  it('keeps a future clock for time-travel scenarios', async () => {
    const anvil = new FakeAnvil({ latest: 200 })
    await alignForkClock(anvil.rpc, FORK)
    assert.deepEqual(anvil.mutations(), [])
    assert.equal(anvil.latest, 200)
  })

  it('rejects a wrong node, chain or fork before any change', async () => {
    for (const anvil of [
      new FakeAnvil({ client: 'geth' }),
      new FakeAnvil({ chainId: '0x1' }),
      new FakeAnvil({ anchor: '0xdef' }),
    ]) {
      await assert.rejects(alignForkClock(anvil.rpc, FORK))
      assert.deepEqual(anvil.mutations(), [])
    }
  })

  it('rejects a failed alignment or a changed anchor', async () => {
    const stuck = new FakeAnvil()
    stuck.mineAdvances = false
    const reorged = new FakeAnvil()
    reorged.mineHash = '0xdef'
    await assert.rejects(alignForkClock(stuck.rpc, FORK), /did not advance/)
    await assert.rejects(alignForkClock(reorged.rpc, FORK), /changed the fork anchor/)
  })

  it('removes the code of every system contract', async () => {
    const anvil = new FakeAnvil()
    await disableSystemContracts(anvil.rpc)
    const cleared = anvil.calls.filter(([method]) => method === 'anvil_setCode').map(([, params]) => params)
    assert.deepEqual(
      cleared,
      SYSTEM_CONTRACTS.map((address) => [address, '0x']),
    )
  })
})
