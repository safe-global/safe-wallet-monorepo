import { setupServer, type SetupServerApi } from 'msw/node'
import { SafenetReader, type SafenetReaderConfig } from '../safenetReader'
import {
  resetLogCounter,
  buildOracleProposedLog,
  buildOracleAttestedLog,
  buildPlainProposedLog,
  buildPlainAttestedLog,
} from '../../builders/rawLogs'
import type { RawLog } from '../../utils/decodeLogs'
import { CheckEventType, type Hex } from '../../types'
import { makeEndpoint } from './rpcEndpoint'

// Mirrors the fixed addresses the raw-log builders encode (see builders/rawLogs.ts).
const CONSENSUS = '0x223624cBF099e5a8f8cD5aF22aFa424a1d1acEE9'
const ORACLE = '0x00000000000000000000000000000000000000AA'
const CHAIN_ID = '100'

const makeReader = (over: Partial<SafenetReaderConfig> = {}, url = 'http://rpc.test/1') =>
  new SafenetReader({
    rpcUrls: [url],
    chainId: CHAIN_ID,
    consensus: CONSENSUS,
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
    })
    const results = await Promise.all([
      reader.fetchCheckState(SAFE_TX_HASH),
      reader.fetchCheckState(SAFE_TX_HASH),
      reader.fetchCheckState(SAFE_TX_HASH),
    ])
    for (const result of results) expect(result.headBlock).toBe('25000')
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
