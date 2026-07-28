import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { Interface } from 'ethers'
import { SafenetReader } from '../safenetReader'
import { CONSENSUS_READ_ABI, COORDINATOR_READ_ABI, CONSENSUS_TOPIC0S } from '../../abi'
import { deriveRequestId } from '../../utils'
import { resetLogCounter, buildV1Lifecycle } from '../../builders'
import type { RawLog } from '../../utils/decodeLogs'
import { AttestationVerificationStatus, CheckEventType, type Hex, type OracleAttestedEvent } from '../../types'

// Mirrors the fixed addresses the raw-log builders encode (see builders/rawLogs.ts).
const CONSENSUS = '0x223624cBF099e5a8f8cD5aF22aFa424a1d1acEE9'
const ORACLE = '0x00000000000000000000000000000000000000AA'
const CHAIN_ID = '100'

const consensusRead = new Interface([...CONSENSUS_READ_ABI])
const coordinatorRead = new Interface([...COORDINATOR_READ_ABI])

type GetLogsFilter = { address?: string; topics: unknown[]; fromBlock: number; toBlock: number }

type RpcConfig = {
  url: string
  chainId?: string
  head?: number
  headTimestamp?: number
  logs?: RawLog[]
  epochGroupId?: string
  coordinator?: string
  groupKey?: { x: string; y: string }
  failGroupKey?: boolean
  failEverything?: boolean
}

const hexToNum = (value: string): number => Number(BigInt(value))

const toRpcLog = (log: RawLog) => ({
  address: log.address ?? ORACLE,
  topics: log.topics,
  data: log.data,
  blockNumber: '0x' + log.blockNumber.toString(16),
  transactionHash: log.transactionHash,
  transactionIndex: '0x0',
  blockHash: '0x' + '11'.repeat(32),
  logIndex: '0x' + log.logIndex.toString(16),
  removed: false,
})

const filterLogs = (logs: RawLog[], filter: GetLogsFilter): RawLog[] => {
  const topic0s = (Array.isArray(filter.topics[0]) ? filter.topics[0] : [filter.topics[0]]) as string[]
  const topic1 = filter.topics[1] as string | undefined
  return logs.filter((log) => {
    if (filter.address && (log.address ?? '').toLowerCase() !== filter.address.toLowerCase()) return false
    if (!topic0s.includes(log.topics[0])) return false
    if (topic1 && log.topics[1] !== topic1) return false
    return log.blockNumber >= filter.fromBlock && log.blockNumber <= filter.toBlock
  })
}

/** One JSON-RPC endpoint recorder + responder. Handles single and batched bodies. */
const makeEndpoint = (config: RpcConfig) => {
  const getLogsCalls: GetLogsFilter[] = []
  const methods: string[] = []

  const respondOne = (req: { id: number; method: string; params: unknown[] }) => {
    methods.push(req.method)
    if (config.failEverything) {
      return { jsonrpc: '2.0', id: req.id, error: { code: -32000, message: 'endpoint down' } }
    }
    const ok = (result: unknown) => ({ jsonrpc: '2.0', id: req.id, result })
    const err = (message: string) => ({ jsonrpc: '2.0', id: req.id, error: { code: 3, message } })

    switch (req.method) {
      case 'eth_chainId':
        return ok('0x' + Number(config.chainId ?? CHAIN_ID).toString(16))
      case 'eth_blockNumber':
        return ok('0x' + (config.head ?? 0).toString(16))
      case 'eth_getBlockByNumber': {
        const head = config.head ?? 0
        const tag = req.params[0] as string
        const number = tag === 'latest' ? head : hexToNum(tag)
        // Synthetic timestamps on a 5s cadence, so block estimation is exact.
        const timestamp = Math.max(0, (config.headTimestamp ?? 1_000_000) - (head - number) * 5)
        return ok({
          number: '0x' + number.toString(16),
          timestamp: '0x' + timestamp.toString(16),
          hash: '0x' + '22'.repeat(32),
          parentHash: '0x' + '33'.repeat(32),
          nonce: '0x0000000000000000',
          difficulty: '0x0',
          gasLimit: '0x1c9c380',
          gasUsed: '0x0',
          miner: '0x' + '00'.repeat(20),
          extraData: '0x',
          baseFeePerGas: '0x7',
          transactions: [],
        })
      }
      case 'eth_getLogs': {
        const raw = req.params[0] as { address?: string; topics: unknown[]; fromBlock: string; toBlock: string }
        const filter: GetLogsFilter = {
          address: raw.address,
          topics: raw.topics,
          fromBlock: hexToNum(raw.fromBlock),
          toBlock: hexToNum(raw.toBlock),
        }
        getLogsCalls.push(filter)
        return ok(filterLogs(config.logs ?? [], filter).map(toRpcLog))
      }
      case 'eth_call': {
        const call = req.params[0] as { to: string; data: string }
        const selector = call.data.slice(0, 10)
        if (selector === consensusRead.getFunction('getEpochGroupId')!.selector) {
          return ok(
            consensusRead.encodeFunctionResult('getEpochGroupId', [config.epochGroupId ?? '0x' + '00'.repeat(32)]),
          )
        }
        if (selector === consensusRead.getFunction('getCoordinator')!.selector) {
          return ok(consensusRead.encodeFunctionResult('getCoordinator', [config.coordinator ?? ORACLE]))
        }
        if (selector === coordinatorRead.getFunction('groupKey')!.selector) {
          if (config.failGroupKey) return err('group key not ready')
          const gk = config.groupKey ?? { x: '1', y: '2' }
          return ok(coordinatorRead.encodeFunctionResult('groupKey', [[BigInt(gk.x), BigInt(gk.y)]]))
        }
        return err('unexpected eth_call')
      }
      default:
        return err(`unhandled ${req.method}`)
    }
  }

  const handler = http.post(config.url, async ({ request }) => {
    const body = (await request.json()) as
      | { id: number; method: string; params: unknown[] }
      | Array<{ id: number; method: string; params: unknown[] }>
    const response = Array.isArray(body) ? body.map(respondOne) : respondOne(body)
    return HttpResponse.json(response)
  })

  return { handler, getLogsCalls, methods }
}

const consensusCalls = (calls: GetLogsFilter[]): GetLogsFilter[] =>
  calls.filter((c) => (Array.isArray(c.topics[0]) ? (c.topics[0] as string[]) : []).includes(CONSENSUS_TOPIC0S[0]))

const oracleCalls = (calls: GetLogsFilter[]): GetLogsFilter[] =>
  calls.filter((c) => !(Array.isArray(c.topics[0]) ? (c.topics[0] as string[]) : []).includes(CONSENSUS_TOPIC0S[0]))

const makeReader = (over: Partial<ConstructorParameters<typeof SafenetReader>[0]> = {}, url = 'http://rpc.test/1') =>
  new SafenetReader({
    rpcUrls: [url],
    chainId: CHAIN_ID,
    consensus: CONSENSUS,
    coordinator: ORACLE,
    oracles: [ORACLE],
    ...over,
  })

/** A V1 lifecycle whose sentinel requestId equals the reader's derived requestId. */
const lifecycleFor = (safeTxHash: Hex): RawLog[] => {
  resetLogCounter()
  const requestId = deriveRequestId({ chainId: CHAIN_ID, consensus: CONSENSUS, epoch: '1', oracle: ORACLE, safeTxHash })
  return buildV1Lifecycle({ safeTxHash, requestId, oracle: ORACLE, epoch: 1n })
}

const SAFE_TX_HASH = ('0x' + 'ab'.repeat(32)) as Hex

let server: ReturnType<typeof setupServer>
afterEach(() => server?.close())

describe('SafenetReader.fetchCheckState', () => {
  it('bootstraps from the chain head and returns the sorted, decoded event set', async () => {
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs: lifecycleFor(SAFE_TX_HASH) })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader().fetchCheckState(SAFE_TX_HASH)

    expect(endpoint.methods).toContain('eth_getBlockByNumber')
    expect(result.headBlock).toBe('25000')
    expect(result.safeTxHash).toBe(SAFE_TX_HASH)
    // Proposed + NewRequest + Committed + OracleResult + Attested.
    expect(result.events.map((e) => e.type)).toEqual([
      CheckEventType.ORACLE_PROPOSED,
      CheckEventType.REQUEST_CREATED,
      CheckEventType.SENTINEL_COMMITTED,
      CheckEventType.ORACLE_RESULT,
      CheckEventType.ORACLE_ATTESTED,
    ])
    // Sorted ascending by (blockNumber, logIndex).
    const keys = result.events.map((e) => e.blockNumber * 1e6 + e.logIndex)
    expect(keys).toEqual([...keys].sort((a, b) => a - b))
    expect(result.requestId).toBe(
      deriveRequestId({
        chainId: CHAIN_ID,
        consensus: CONSENSUS,
        epoch: '1',
        oracle: ORACLE,
        safeTxHash: SAFE_TX_HASH,
      }),
    )
    expect(result.epoch).toBe('1')
    expect(result.deadlineBlock).toBe('150')
  })

  it('chunks the lookback window into ≤10k-block getLogs for each of the two filters', async () => {
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs: lifecycleFor(SAFE_TX_HASH) })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader().fetchCheckState(SAFE_TX_HASH)

    const cons = consensusCalls(endpoint.getLogsCalls)
    const orac = oracleCalls(endpoint.getLogsCalls)
    expect(cons.map((c) => [c.fromBlock, c.toBlock])).toEqual([
      [0, 9999],
      [10_000, 19_999],
      [20_000, 25_000],
    ])
    expect(orac.map((c) => [c.fromBlock, c.toBlock])).toEqual([
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

    const calls = consensusCalls(endpoint.getLogsCalls)
    expect(calls[0].fromBlock).toBe(15_001)
    expect(calls).toHaveLength(3)
  })

  it('targets a narrow window around the transaction timestamp instead of scanning back from the head', async () => {
    // Head is block 1,000,000 at t=1,000,000s, blocks every 5s (see the mock).
    // A transaction 100,000s earlier sits at block 1,000,000 − 20,000 = 980,000.
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 1_000_000, headTimestamp: 1_000_000, logs: [] })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader().fetchCheckState(SAFE_TX_HASH, { timestampMs: 900_000 * 1000 })

    const call = consensusCalls(endpoint.getLogsCalls)[0]
    expect(call.fromBlock).toBe(975_000)
    expect(call.toBlock).toBe(984_999)
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

  it('falls back to the head-relative scan when no timestamp is given', async () => {
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 45_000, logs: [] })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader().fetchCheckState(SAFE_TX_HASH)

    expect(consensusCalls(endpoint.getLogsCalls)[0].fromBlock).toBe(15_001)
  })

  it('targets Proposed.oracle for the oracle getLogs when no override is set', async () => {
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs: lifecycleFor(SAFE_TX_HASH) })
    server = setupServer(endpoint.handler)
    server.listen()

    await makeReader().fetchCheckState(SAFE_TX_HASH)

    for (const call of oracleCalls(endpoint.getLogsCalls)) {
      expect(call.address?.toLowerCase()).toBe(ORACLE.toLowerCase())
    }
  })

  it('ignores a proposal naming an oracle that is not on the allowlist', async () => {
    // proposeOracleTransaction is permissionless, so the oracle address in the
    // event is attacker-chosen. An unlisted one must not be read from at all.
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs: lifecycleFor(SAFE_TX_HASH) })
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
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', head: 25_000, logs: lifecycleFor(SAFE_TX_HASH) })
    server = setupServer(endpoint.handler)
    server.listen()

    const result = await makeReader({ oracles: [] }).fetchCheckState(SAFE_TX_HASH)

    expect(oracleCalls(endpoint.getLogsCalls)).toHaveLength(0)
    expect(result.requestId).toBeNull()
  })

  it('propagates the failure when every RPC endpoint is down', async () => {
    const endpoint = makeEndpoint({ url: 'http://rpc.test/1', failEverything: true })
    server = setupServer(endpoint.handler)
    server.listen()

    await expect(makeReader().fetchCheckState(SAFE_TX_HASH)).rejects.toBeDefined()
  })

  it('rotates to the next endpoint when the first one fails', async () => {
    const down = makeEndpoint({ url: 'http://rpc.test/1', failEverything: true })
    const up = makeEndpoint({ url: 'http://rpc.test/2', head: 25_000, logs: lifecycleFor(SAFE_TX_HASH) })
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

describe('SafenetReader.verifyAttestation', () => {
  type Golden = {
    chainId: string
    consensus: string
    coordinator: string
    oracle: string
    epoch: string
    safeTxHash: Hex
    requestId: Hex
    signatureId: Hex
    groupId: Hex
    groupKey: { x: string; y: string }
    r: { x: string; y: string }
    z: string
  }
  const golden: Golden = JSON.parse(
    readFileSync(join(__dirname, '../../__fixtures__/devnet-attestation.golden.json'), 'utf8'),
  )

  const attestedEvent = (): OracleAttestedEvent => ({
    blockNumber: 1,
    logIndex: 0,
    transactionHash: '0x' + '00'.repeat(32),
    generation: 'STABLE' as OracleAttestedEvent['generation'],
    type: CheckEventType.ORACLE_ATTESTED,
    safeTxHash: golden.safeTxHash,
    chainId: golden.chainId,
    safe: golden.oracle,
    epoch: golden.epoch,
    oracle: golden.oracle,
    signatureId: golden.signatureId,
    attestation: { r: { x: golden.r.x, y: golden.r.y }, z: golden.z },
  })

  const readerForGolden = (over: Partial<RpcConfig> = {}) => {
    const endpoint = makeEndpoint({
      url: 'http://rpc.test/g',
      chainId: golden.chainId,
      epochGroupId: golden.groupId,
      coordinator: golden.coordinator,
      groupKey: golden.groupKey,
      ...over,
    })
    server = setupServer(endpoint.handler)
    server.listen()
    const reader = new SafenetReader({
      rpcUrls: ['http://rpc.test/g'],
      chainId: golden.chainId,
      consensus: golden.consensus,
      coordinator: golden.coordinator,
      oracles: [golden.oracle],
    })
    return { reader, endpoint }
  }

  it('resolves VERIFIED for the real devnet attestation (getEpochGroupId → groupKey → FROST)', async () => {
    const { reader } = readerForGolden()
    const result = await reader.verifyAttestation(attestedEvent())
    expect(result).toEqual({
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: golden.signatureId,
      message: golden.requestId,
    })
  })

  it('resolves PENDING (retryable) when the group key cannot be fetched', async () => {
    const { reader } = readerForGolden({ failGroupKey: true })
    const result = await reader.verifyAttestation(attestedEvent())
    expect(result.status).toBe(AttestationVerificationStatus.PENDING)
  })

  it('resolves INVALID (terminal) when the signature does not verify against the group key', async () => {
    const tampered = { x: (BigInt(golden.groupKey.x) + 1n).toString(), y: golden.groupKey.y }
    const { reader } = readerForGolden({ groupKey: tampered })
    const result = await reader.verifyAttestation(attestedEvent())
    expect(result.status).toBe(AttestationVerificationStatus.INVALID)
  })

  it('caches terminal outcomes by signatureId (no second group-key fetch)', async () => {
    const { reader, endpoint } = readerForGolden()
    await reader.verifyAttestation(attestedEvent())
    const callsAfterFirst = endpoint.methods.filter((m) => m === 'eth_call').length
    await reader.verifyAttestation(attestedEvent())
    const callsAfterSecond = endpoint.methods.filter((m) => m === 'eth_call').length
    expect(callsAfterSecond).toBe(callsAfterFirst)
  })
})
