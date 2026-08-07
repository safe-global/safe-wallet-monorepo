import { setupServer, type SetupServerApi } from 'msw/node'
import { SafenetReader, type SafenetReaderConfig } from '../safenetReader'
import { CONSENSUS_TOPIC0S } from '../../abi'
import { oracleProposalHash } from '../../utils/oracleProposalHash'
import {
  resetLogCounter,
  buildOracleProposedLog,
  buildOracleAttestedLog,
  buildPlainProposedLog,
  buildPlainAttestedLog,
  buildOracleResultLog,
  buildV1Lifecycle,
  buildV2Lifecycle,
} from '../../builders/rawLogs'
import type { RawLog } from '../../utils/decodeLogs'
import { CheckEventType, OracleGeneration, type Hex } from '../../types'
import { makeEndpoint, type GetLogsFilter } from './rpcEndpoint'

const consensusCalls = (calls: GetLogsFilter[]): GetLogsFilter[] =>
  calls.filter((c) => (Array.isArray(c.topics[0]) ? (c.topics[0] as string[]) : []).includes(CONSENSUS_TOPIC0S[0]))

const oracleCalls = (calls: GetLogsFilter[]): GetLogsFilter[] =>
  calls.filter((c) => !(Array.isArray(c.topics[0]) ? (c.topics[0] as string[]) : []).includes(CONSENSUS_TOPIC0S[0]))
// Mirrors the fixed addresses the raw-log builders encode (see builders/rawLogs.ts).
const CONSENSUS = '0x223624cBF099e5a8f8cD5aF22aFa424a1d1acEE9'
const ORACLE = '0x00000000000000000000000000000000000000AA'
const CHAIN_ID = '100'

const makeReader = (over: Partial<SafenetReaderConfig> = {}, url = 'http://rpc.test/1') =>
  new SafenetReader({
    rpcUrls: [url],
    chainId: CHAIN_ID,
    consensus: CONSENSUS,
    coordinator: ORACLE,
    oracles: [],
    ...over,
  })

/**
 * The plain (non-oracle) pair — the only lifecycle live beta emits. Built with
 * OUT-OF-ORDER metas so the reader's (blockNumber, logIndex) sort has teeth:
 * the harness replays logs in insertion order.
 */
const plainPairFor = (safeTxHash: Hex): RawLog[] => {
  resetLogCounter()
  return [
    buildPlainAttestedLog({ safeTxHash, epoch: 7n }, { blockNumber: 200, logIndex: 0 }),
    buildPlainProposedLog({ safeTxHash, epoch: 7n }, { blockNumber: 100, logIndex: 5 }),
  ]
}

const SAFE_TX_HASH = ('0x' + 'ab'.repeat(32)) as Hex

let server: SetupServerApi
afterEach(() => server?.close())

describe('SafenetReader.fetchCheckState', () => {
  it('bootstraps from the chain head and returns the sorted, decoded plain pair', async () => {
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs: plainPairFor(SAFE_TX_HASH) })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader().fetchCheckState(SAFE_TX_HASH)

    expect(endpoint.methods).toContain('eth_getBlockByNumber')
    expect(result.headBlock).toBe('25000')
    expect(result.safeTxHash).toBe(SAFE_TX_HASH)
    expect(result.events.map((e) => e.type)).toEqual([CheckEventType.PLAIN_PROPOSED, CheckEventType.PLAIN_ATTESTED])
    // Sorted ascending by (blockNumber, logIndex).
    const keys = result.events.map((e) => e.blockNumber * 1e6 + e.logIndex)
    expect(keys).toEqual([...keys].sort((a, b) => a - b))
  })

  it('decodes the oracle-path Consensus events too (proposed + attested)', async () => {
    resetLogCounter()
    const logs = [
      buildOracleProposedLog({ safeTxHash: SAFE_TX_HASH, epoch: 1n, oracle: ORACLE }),
      buildOracleAttestedLog({ safeTxHash: SAFE_TX_HASH, epoch: 1n, oracle: ORACLE }),
    ]
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader().fetchCheckState(SAFE_TX_HASH)

    expect(result.events.map((e) => e.type)).toEqual([CheckEventType.ORACLE_PROPOSED, CheckEventType.ORACLE_ATTESTED])
    // Only the Consensus address is read — sentinel-oracle correlation is the
    // next slice's job.
    for (const call of endpoint.getLogsCalls) {
      expect(call.address?.toLowerCase()).toBe(CONSENSUS.toLowerCase())
    }
  })

  it('rejects a malformed safeTxHash before touching any endpoint', async () => {
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs: [] })
    server = setupServer(endpoint.handler)
    server.listen()

    await expect(makeReader().fetchCheckState('0xnot-a-hash')).rejects.toThrow('invalid safeTxHash')
    expect(endpoint.methods).toHaveLength(0)
  })

  it('chunks the lookback window into ≤10k-block getLogs calls', async () => {
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs: plainPairFor(SAFE_TX_HASH) })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader().fetchCheckState(SAFE_TX_HASH)

    expect(endpoint.getLogsCalls.map((c) => [c.fromBlock, c.toBlock])).toEqual([
      [0, 9999],
      [10_000, 19_999],
      [20_000, 25_000],
    ])
  })

  it('caps the scan at exactly 30k blocks — 3 whole chunks, no degenerate 4th', async () => {
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 45_000, logs: [] })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader().fetchCheckState(SAFE_TX_HASH)

    expect(endpoint.getLogsCalls[0].fromBlock).toBe(15_001)
    expect(endpoint.getLogsCalls).toHaveLength(3)
  })

  it('propagates the failure when every RPC endpoint is down', async () => {
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', failEverything: true })
    server = setupServer(endpoint.handler)
    server.listen()

    await expect(makeReader().fetchCheckState(SAFE_TX_HASH)).rejects.toBeDefined()
    // The endpoint was actually touched — the rejection is not a config error.
    expect(endpoint.methods.length).toBeGreaterThan(0)
  })

  it('rotates to the next endpoint when the first one fails', async () => {
    const down = makeEndpoint({ url: 'http://rpc.test/1', failEverything: true })
    const up = makeEndpoint({ url: 'http://rpc.test/2', head: 25_000, logs: plainPairFor(SAFE_TX_HASH) })
    server = setupServer(down.handler, up.handler)
    server.listen()

    const reader = new SafenetReader({
      rpcUrls: ['http://rpc.test/1', 'http://rpc.test/2'],
      chainId: CHAIN_ID,
      consensus: CONSENSUS,
      coordinator: ORACLE,
      oracles: [],
    })
    const result = await reader.fetchCheckState(SAFE_TX_HASH)
    expect(result.headBlock).toBe('25000')
    expect(up.methods.length).toBeGreaterThan(0)
  })

  it('survives concurrent reads racing failing endpoints — rotation is not double-applied', async () => {
    // Two dead endpoints + one healthy: an unguarded double-rotation strands a
    // retry on a dead URL and the read fails; the generation guard cannot.
    const down1 = makeEndpoint({ url: 'http://rpc.test/1', failEverything: true })
    const down2 = makeEndpoint({ url: 'http://rpc.test/2', failEverything: true })
    const up = makeEndpoint({ url: 'http://rpc.test/3', head: 25_000, logs: plainPairFor(SAFE_TX_HASH) })
    server = setupServer(down1.handler, down2.handler, up.handler)
    server.listen()

    const reader = new SafenetReader({
      rpcUrls: ['http://rpc.test/1', 'http://rpc.test/2', 'http://rpc.test/3'],
      chainId: CHAIN_ID,
      consensus: CONSENSUS,
      coordinator: ORACLE,
      oracles: [],
    })
    const results = await Promise.all([
      reader.fetchCheckState(SAFE_TX_HASH),
      reader.fetchCheckState(SAFE_TX_HASH),
      reader.fetchCheckState(SAFE_TX_HASH),
    ])
    for (const result of results) expect(result.headBlock).toBe('25000')
  })

  it('reads a V1 oracle lifecycle: sentinel logs, generation, and the request deadline', async () => {
    resetLogCounter()
    const requestId = oracleProposalHash({
      chainId: CHAIN_ID,
      consensus: CONSENSUS,
      epoch: '1',
      oracle: ORACLE,
      safeTxHash: SAFE_TX_HASH,
    })
    const logs = buildV1Lifecycle({ safeTxHash: SAFE_TX_HASH, requestId, oracle: ORACLE, epoch: 1n })
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader({ oracles: [ORACLE] }).fetchCheckState(SAFE_TX_HASH)

    // Proposed + NewRequest + Committed + OracleResult + Attested.
    expect(result.events.map((e) => e.type)).toEqual([
      CheckEventType.ORACLE_PROPOSED,
      CheckEventType.REQUEST_CREATED,
      CheckEventType.SENTINEL_COMMITTED,
      CheckEventType.ORACLE_RESULT,
      CheckEventType.ORACLE_ATTESTED,
    ])
    expect(result.requestId).toBe(requestId)
    expect(result.epoch).toBe('1')
    expect(result.deadlineBlock).toBe('150')
    // V1 sentinel events carry the V1 generation marker.
    expect(result.generation).toBe(OracleGeneration.V1)
  })

  it('returns null correlation fields for the plain pair — the beta path has no oracle', async () => {
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs: plainPairFor(SAFE_TX_HASH) })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader({ oracles: [ORACLE] }).fetchCheckState(SAFE_TX_HASH)

    expect(oracleCalls(endpoint.getLogsCalls)).toHaveLength(0)
    expect(result.requestId).toBeNull()
    expect(result.epoch).toBeNull()
    expect(result.oracle).toBeNull()
    expect(result.deadlineBlock).toBeNull()
    expect(result.generation).toBeNull()
  })

  it('targets Proposed.oracle for the sentinel getLogs when the proposal names an allowlisted oracle', async () => {
    resetLogCounter()
    const logs = [buildOracleProposedLog({ safeTxHash: SAFE_TX_HASH, epoch: 1n, oracle: ORACLE })]
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader({ oracles: [ORACLE] }).fetchCheckState(SAFE_TX_HASH)

    const orac = oracleCalls(endpoint.getLogsCalls)
    // Guard against a vacuous pass: the sentinel read must actually happen.
    expect(orac.length).toBeGreaterThan(0)
    for (const call of orac) {
      expect(call.address?.toLowerCase()).toBe(ORACLE.toLowerCase())
    }
  })

  it('ignores a proposal naming an oracle that is not on the allowlist', async () => {
    // proposeOracleTransaction is permissionless, so the oracle address in the
    // event is attacker-chosen. An unlisted one must not be read from at all.
    resetLogCounter()
    const logs = buildV1Lifecycle({ safeTxHash: SAFE_TX_HASH, oracle: ORACLE, epoch: 1n })
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader({ oracles: ['0x000000000000000000000000000000000000dEaD'] }).fetchCheckState(
      SAFE_TX_HASH,
    )

    expect(oracleCalls(endpoint.getLogsCalls)).toHaveLength(0)
    expect(result.requestId).toBeNull()
    expect(result.events.every((event) => event.type !== CheckEventType.ORACLE_RESULT)).toBe(true)
  })

  it("skips the oracle path entirely when the allowlist is empty (today's default)", async () => {
    resetLogCounter()
    const logs = buildV1Lifecycle({ safeTxHash: SAFE_TX_HASH, oracle: ORACLE, epoch: 1n })
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader().fetchCheckState(SAFE_TX_HASH)

    expect(oracleCalls(endpoint.getLogsCalls)).toHaveLength(0)
    expect(result.requestId).toBeNull()
  })

  it('reads sentinel logs for EVERY allowlisted proposal, deduplicated, keyed to the latest', async () => {
    resetLogCounter()
    const logs = [
      buildOracleProposedLog({ safeTxHash: SAFE_TX_HASH, epoch: 1n, oracle: ORACLE }),
      // Same (epoch, oracle) again — must NOT produce a second identical requestId.
      buildOracleProposedLog({ safeTxHash: SAFE_TX_HASH, epoch: 1n, oracle: ORACLE }),
      buildOracleProposedLog({ safeTxHash: SAFE_TX_HASH, epoch: 2n, oracle: ORACLE }),
    ]
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader({ oracles: [ORACLE] }).fetchCheckState(SAFE_TX_HASH)

    const ids = ['1', '2'].map((epoch) =>
      oracleProposalHash({ chainId: CHAIN_ID, consensus: CONSENSUS, epoch, oracle: ORACLE, safeTxHash: SAFE_TX_HASH }),
    )
    const orac = oracleCalls(endpoint.getLogsCalls)
    // One getLogs per oracle per chunk, carrying both requestIds (deduped) as a
    // topic1 OR-array. Compared as a set: ethers sorts topic arrays on the way
    // out, so proposal order does not reach the wire.
    expect(orac.length).toBeGreaterThan(0)
    for (const call of orac) expect([...(call.topics[1] as string[])].sort()).toEqual([...ids].sort())
    // The correlation fields follow the latest allowlisted proposal.
    expect(result.epoch).toBe('2')
    expect(result.requestId).toBe(ids[1])
  })

  it('reads only the allowlisted oracle when one proposal names it and another names an attacker', async () => {
    resetLogCounter()
    const ATTACKER = '0x000000000000000000000000000000000000BEEF'
    const logs = [
      buildOracleProposedLog({ safeTxHash: SAFE_TX_HASH, epoch: 1n, oracle: ORACLE }),
      buildOracleProposedLog({ safeTxHash: SAFE_TX_HASH, epoch: 1n, oracle: ATTACKER }),
    ]
    // One chunk's worth of head, so the oracle read is exactly one getLogs.
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 5_000, logs })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader({ oracles: [ORACLE] }).fetchCheckState(SAFE_TX_HASH)

    const orac = oracleCalls(endpoint.getLogsCalls)
    expect(orac).toHaveLength(1)
    expect(orac[0].address?.toLowerCase()).toBe(ORACLE.toLowerCase())
    expect(endpoint.getLogsCalls.some((c) => c.address?.toLowerCase() === ATTACKER.toLowerCase())).toBe(false)
    // The attacker's proposal is the LATEST, but it must not become the active one.
    expect(result.oracle?.toLowerCase()).toBe(ORACLE.toLowerCase())
  })

  it('drops an attacker-emitted OracleResult even when it carries the correct requestId', async () => {
    // The requestId is derivable by anyone, so on its own it proves nothing.
    // The emitting address is what the reader gates on, not the topic filter.
    resetLogCounter()
    const ATTACKER = '0x000000000000000000000000000000000000BEEF'
    const requestId = oracleProposalHash({
      chainId: CHAIN_ID,
      consensus: CONSENSUS,
      epoch: '1',
      oracle: ORACLE,
      safeTxHash: SAFE_TX_HASH,
    })
    const logs = [
      buildOracleProposedLog({ safeTxHash: SAFE_TX_HASH, epoch: 1n, oracle: ORACLE }),
      { ...buildOracleResultLog({ requestId, approved: false }), address: ATTACKER },
    ]
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader({ oracles: [ORACLE] }).fetchCheckState(SAFE_TX_HASH)

    expect(result.requestId).toBe(requestId)
    expect(result.events.some((event) => event.type === CheckEventType.ORACLE_RESULT)).toBe(false)
  })

  it('buckets requestIds per oracle — two allowlisted oracles get one getLogs each', async () => {
    resetLogCounter()
    const OTHER = '0x00000000000000000000000000000000000000bb'
    const logs = [
      buildOracleProposedLog({ safeTxHash: SAFE_TX_HASH, epoch: 1n, oracle: ORACLE }),
      buildOracleProposedLog({ safeTxHash: SAFE_TX_HASH, epoch: 1n, oracle: OTHER }),
    ]
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader({ oracles: [ORACLE, OTHER] }).fetchCheckState(SAFE_TX_HASH)

    const byAddress = new Map(oracleCalls(endpoint.getLogsCalls).map((c) => [c.address?.toLowerCase(), c]))
    expect([...byAddress.keys()].sort()).toEqual([ORACLE.toLowerCase(), OTHER.toLowerCase()].sort())
    for (const [address, call] of byAddress) {
      const expected = oracleProposalHash({
        chainId: CHAIN_ID,
        consensus: CONSENSUS,
        epoch: '1',
        oracle: address === ORACLE.toLowerCase() ? ORACLE : OTHER,
        safeTxHash: SAFE_TX_HASH,
      })
      // Each filter carries only its own oracle's id, not a pooled set.
      expect(call.topics[1]).toEqual([expected])
    }
  })

  it('caps the requestId OR-filter at 16, keeping the newest (active) id', async () => {
    resetLogCounter()
    const epochs = Array.from({ length: 20 }, (_, index) => BigInt(index + 1))
    const logs = epochs.map((epoch) => buildOracleProposedLog({ safeTxHash: SAFE_TX_HASH, epoch, oracle: ORACLE }))
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 5_000, logs })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader({ oracles: [ORACLE] }).fetchCheckState(SAFE_TX_HASH)

    const orac = oracleCalls(endpoint.getLogsCalls)
    expect(orac).toHaveLength(1)
    expect(orac[0].topics[1]).toHaveLength(16)
    // The live re-proposal is the newest one, so its id must survive the cap.
    expect(result.epoch).toBe('20')
    expect(orac[0].topics[1]).toContain(result.requestId)
  })

  it('reads a V2 lifecycle: the reveal deadline and the V2 generation marker', async () => {
    resetLogCounter()
    const requestId = oracleProposalHash({
      chainId: CHAIN_ID,
      consensus: CONSENSUS,
      epoch: '1',
      oracle: ORACLE,
      safeTxHash: SAFE_TX_HASH,
    })
    const logs = buildV2Lifecycle({ safeTxHash: SAFE_TX_HASH, requestId, oracle: ORACLE, epoch: 1n })
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader({ oracles: [ORACLE] }).fetchCheckState(SAFE_TX_HASH)

    expect(result.generation).toBe(OracleGeneration.V2)
    // V2's revealDeadline is normalized onto the same deadlineBlock as V1's.
    expect(result.deadlineBlock).toBe('160')
  })

  it('returns a Redux-serializable result — no bigints survive the read', async () => {
    resetLogCounter()
    const requestId = oracleProposalHash({
      chainId: CHAIN_ID,
      consensus: CONSENSUS,
      epoch: '1',
      oracle: ORACLE,
      safeTxHash: SAFE_TX_HASH,
    })
    const logs = buildV1Lifecycle({ safeTxHash: SAFE_TX_HASH, requestId, oracle: ORACLE, epoch: 1n })
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader({ oracles: [ORACLE] }).fetchCheckState(SAFE_TX_HASH)

    expect(JSON.parse(JSON.stringify(result))).toEqual(result)
  })

  it('targets a narrow window around the transaction timestamp instead of scanning back from the head', async () => {
    // Head is block 1,000,000 at t=1,000,000s, blocks every 5s (see the mock).
    // A transaction 100,000s earlier sits at block 1,000,000 − 20,000 = 980,000.
    // The window is biased forward: 1,000 blocks back, the rest of the chunk on.
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 1_000_000, headTimestamp: 1_000_000, logs: [] })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader().fetchCheckState(SAFE_TX_HASH, { timestampMs: 900_000 * 1000 })

    const call = consensusCalls(endpoint.getLogsCalls)[0]
    expect(call.fromBlock).toBe(979_000)
    expect(call.toBlock).toBe(988_999)
  })

  it('reads an old check in a single getLogs — cost does not grow with age', async () => {
    const HEAD_TS = 1_800_000_000
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 9_000_000, headTimestamp: HEAD_TS, logs: [] })
    server = setupServer(endpoint.handler)
    server.listen()

    // A year-old transaction: the head-relative scan could never have reached it.
    await makeReader().fetchCheckState(SAFE_TX_HASH, { timestampMs: (HEAD_TS - 31_536_000) * 1000 })

    expect(consensusCalls(endpoint.getLogsCalls)).toHaveLength(1)
  })
})

describe('SafenetReader block targeting — estimate convergence', () => {
  it('converges on a chain whose real block time drifted from the nominal 5s', async () => {
    // 10s blocks: the nominal-seeded first guess lands 10,000 blocks off — far
    // enough that a nominal-only estimator misses the window entirely. One probe
    // measures the real cadence and the second guess is exact: target t=900,000
    // → block 990,000, window [989,000, 998,999].
    const endpoint = makeEndpoint({
      url: 'http://rpc.test/1',
      head: 1_000_000,
      headTimestamp: 1_000_000,
      blockTimeSeconds: 10,
      logs: [],
    })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader().fetchCheckState(SAFE_TX_HASH, { timestampMs: 900_000 * 1000 })

    const calls = consensusCalls(endpoint.getLogsCalls)
    expect(calls).toHaveLength(1)
    expect([calls[0].fromBlock, calls[0].toBlock]).toEqual([989_000, 998_999])
  })

  it('falls back to the head-relative scan when the estimate cannot converge', async () => {
    // A chain that "paused": no block's timestamp is anywhere near the target,
    // so every refinement still leaves a huge residual drift. The reader must
    // not aim a window it knows is off — it scans back from the head instead.
    const endpoint = makeEndpoint({
      url: 'http://rpc.test/1',
      head: 600_000,
      timestampAt: (n) => (n <= 500_000 ? n : 10_000_000 + (n - 500_000) * 5),
      logs: [],
    })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader().fetchCheckState(SAFE_TX_HASH, { timestampMs: 5_000_000 * 1000 })

    const calls = consensusCalls(endpoint.getLogsCalls)
    expect(calls.map((c) => [c.fromBlock, c.toBlock])).toEqual([
      [570_001, 580_000],
      [580_001, 590_000],
      [590_001, 600_000],
    ])
  })

  it('falls back to the head-relative scan when block probes return no block', async () => {
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 45_000, failBlockProbes: 'null', logs: [] })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader().fetchCheckState(SAFE_TX_HASH, { timestampMs: 1_000 * 1000 })

    const calls = consensusCalls(endpoint.getLogsCalls)
    expect(calls[0].fromBlock).toBe(15_001)
    expect(calls).toHaveLength(3)
  })

  it('falls back to the head-relative scan when a block probe errors on the only endpoint', async () => {
    // `missing trie node` for an old header is routine on load-balanced public
    // RPC, and unlike a null result it rejects in ethers. A probe is an
    // optimisation, so it must not take the whole read or a rotation with it.
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 45_000, failBlockProbes: 'error', logs: [] })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader().fetchCheckState(SAFE_TX_HASH, { timestampMs: 1_000 * 1000 })

    expect(result.headBlock).toBe('45000')
    expect(consensusCalls(endpoint.getLogsCalls)).toHaveLength(3)
  })

  it('falls back when the cadence local to the target is far faster than the secant to the head', async () => {
    // A 1s stretch inside an otherwise 5.5s chain. The probes converge on the
    // secant cadence and stall ~12,850s short; converting that residual with any
    // head-derived cadence would under-count it by 5x and aim a window ~7,850
    // blocks past the true block (350,000). Only convergence may aim.
    const endpoint = makeEndpoint({
      url: 'http://rpc.test/1',
      head: 1_000_000,
      timestampAt: (n) =>
        n >= 400_000
          ? 3_100_000 + 5.5 * (n - 400_000)
          : n >= 300_000
            ? 3_000_000 + (n - 300_000)
            : 3_000_000 - 5.5 * (300_000 - n),
      logs: [],
    })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader().fetchCheckState(SAFE_TX_HASH, { timestampMs: 3_050_000 * 1000 })

    const calls = consensusCalls(endpoint.getLogsCalls)
    expect(calls.map((c) => c.fromBlock)).toEqual([970_001, 980_001, 990_001])
  })

  it('pins the window to the head for a timestamp at or beyond it', async () => {
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 1_000_000, headTimestamp: 1_000_000, logs: [] })
    server = setupServer(endpoint.handler)
    server.listen()

    // 30,000s in the future — caller clock skew, or a check read before its
    // block lands. The head IS the right aim, so this stays a single window.
    await makeReader().fetchCheckState(SAFE_TX_HASH, { timestampMs: 1_030_000 * 1000 })

    const calls = consensusCalls(endpoint.getLogsCalls)
    expect(calls).toHaveLength(1)
    expect(calls[0].toBlock).toBe(1_000_000)
  })

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('ignores a %s timestamp and scans head-relative', async (_label, timestampMs) => {
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 45_000, logs: [] })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader().fetchCheckState(SAFE_TX_HASH, { timestampMs })

    // No probe was issued at all — the guard runs before any estimate.
    expect(endpoint.methods.filter((method) => method === 'eth_getBlockByNumber')).toHaveLength(1)
    expect(consensusCalls(endpoint.getLogsCalls)).toHaveLength(3)
  })

  it('clamps the window at block 0 for a check near genesis', async () => {
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 8_000, headTimestamp: 40_000, logs: [] })
    server = setupServer(endpoint.handler)
    server.listen()

    // t=10,000s → block 2,000; centre − 1,000 = 1,000, so no clamp is needed at
    // 1,000 back, but the head clamp caps the forward reach at the chain tip.
    await makeReader().fetchCheckState(SAFE_TX_HASH, { timestampMs: 10_000 * 1000 })

    const calls = consensusCalls(endpoint.getLogsCalls)
    expect(calls).toHaveLength(1)
    expect([calls[0].fromBlock, calls[0].toBlock]).toEqual([1_000, 8_000])
  })

  it('returns the events inside an aimed window, including the far forward edge', async () => {
    // Bounds-only assertions would pass a window shifted by one block. Place a
    // log at the centre and another at the last block the chunk reaches.
    resetLogCounter()
    const centre = 980_000
    const logs = [
      buildPlainProposedLog({ safeTxHash: SAFE_TX_HASH, epoch: 7n }, { blockNumber: centre, logIndex: 0 }),
      buildPlainAttestedLog({ safeTxHash: SAFE_TX_HASH, epoch: 7n }, { blockNumber: 988_999, logIndex: 0 }),
    ]
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 1_000_000, headTimestamp: 1_000_000, logs })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader().fetchCheckState(SAFE_TX_HASH, { timestampMs: 900_000 * 1000 })

    expect(result.events.map((event) => event.blockNumber)).toEqual([centre, 988_999])
  })
})

describe('SafenetReader chain-id assertion (dev-only, one-shot)', () => {
  it('logs a loud error when the RPC chain id disagrees with SAFENET_CHAIN_ID', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', chainId: '31337', head: 10, logs: [] })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader({ chainId: '100' }).fetchCheckState(SAFE_TX_HASH)

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('chain id mismatch'))
    spy.mockRestore()
  })

  it('stays silent when the RPC chain id matches', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', chainId: '100', head: 10, logs: [] })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader({ chainId: '100' }).fetchCheckState(SAFE_TX_HASH)

    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
