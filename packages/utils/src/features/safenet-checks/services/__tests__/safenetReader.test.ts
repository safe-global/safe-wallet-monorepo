import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Interface, type InterfaceAbi } from 'ethers'
import { setupServer, type SetupServerApi } from 'msw/node'
import type { RequestHandler } from 'msw'
import {
  assertPinnedDeployment,
  SafenetReader,
  type FetchCheckStateOptions,
  type SafenetReaderConfig,
} from '../safenetReader'
import type * as SafenetReaderModule from '../safenetReader'
import { CONSENSUS_READ_ABI, CONSENSUS_TOPIC0S, COORDINATOR_READ_ABI, ORACLE_READ_ABI } from '../../abi'
import { transactionProposalHash } from '../../utils/proposalHash'
import { BLOCK_ESTIMATE_TOLERANCE_SECONDS, SAFENET_DEPLOYMENT, SAFENET_DEPLOYMENT_BLOCK } from '../../constants'
import {
  resetLogCounter,
  buildOracleProposedLog,
  buildOracleAttestedLog,
  buildNewRequestLog,
  buildCommittedLog,
  buildRevealedLog,
  buildOracleResultLog,
  EMPTY_ORACLE_DATA_HASH,
} from '../../builders/rawLogs'
import type { RawLog } from '../../utils/decodeLogs'
import { CheckEventType, type Hex } from '../../types'
import { makeEndpoint, type EthCall, type GetLogsFilter, type RequestStateSpec, type RpcConfig } from './rpcEndpoint'

/** What the tests use of a `makeEndpoint` result; the harness exports no named type for it. */
type Endpoint = {
  handler: RequestHandler
  getLogsCalls: GetLogsFilter[]
  ethCalls: EthCall[]
  methods: string[]
  gate: { logsArrived: Promise<void>; releaseLogs: () => void }
}
type LogOverrides = { epoch?: bigint; oracle?: string; safe?: string; chainId?: bigint }
type PinnedConfig = Omit<SafenetReaderConfig, 'rpcUrls'>
type RpcBody = { method: string }
type BlockRange = [number, number]
type ReaderModule = typeof SafenetReaderModule

const D = SAFENET_DEPLOYMENT_BLOCK
const CHAIN_ID = '100'
const ORACLE = '0x00000000000000000000000000000000000000AA'
const OTHER_ORACLE = '0x00000000000000000000000000000000000000bb'
const UNLISTED_ORACLE = '0x000000000000000000000000000000000000dead'
const ATTACKER = '0x000000000000000000000000000000000000beef'
const OTHER_ADDRESS = '0x000000000000000000000000000000000000c0de'
const HOME = '1'
const SAFE = '0x5afe5afe5afe5afe5afe5afe5afe5afe5afe5afe'
const OTHER_SAFE = '0x0ddba11ba11ba11ba11ba11ba11ba11ba11ba11b'
const TARGET = { chainId: HOME, safeAddress: SAFE }
const SAFE_TX_HASH = ('0x' + 'ab'.repeat(32)) as Hex
const RPC_1 = 'http://rpc.test/1'
const RPC_2 = 'http://rpc.test/2'
const RPC_3 = 'http://rpc.test/3'
const HEAD_TS = 1_800_000_000
const BLOCK_SECONDS = 5
const GROUP_ID = '0x' + '11'.repeat(32)
const SENTINEL = '0x' + '5e'.repeat(20)

const aegis: { captures: Array<{ epoch: string; groupKey: { x: string; y: string } }> } = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/gnosis-aegis.json'), 'utf8'),
)
const { epoch: GROUP_EPOCH, groupKey: GROUP_KEY } = aegis.captures[0]

const selectorOf = (abi: InterfaceAbi, name: string): string => new Interface(abi).getFunction(name)!.selector
const GET_COORDINATOR = selectorOf(CONSENSUS_READ_ABI, 'getCoordinator')
const LINKAGE_SELECTORS = [GET_COORDINATOR, selectorOf(ORACLE_READ_ABI, 'PROPOSER')]
const GROUP_KEY_SELECTORS = [
  selectorOf(CONSENSUS_READ_ABI, 'getEpochGroupId'),
  selectorOf(COORDINATOR_READ_ABI, 'groupKey'),
]
const GET_REQUEST = selectorOf(ORACLE_READ_ABI, 'getRequest')

const callsTo = (endpoint: Endpoint, selectors: string[]) =>
  endpoint.ethCalls.filter(({ selector }) => selectors.includes(selector))

const consensusCalls = (calls: GetLogsFilter[]): GetLogsFilter[] =>
  calls.filter((c) => (Array.isArray(c.topics[0]) ? (c.topics[0] as string[]) : []).includes(CONSENSUS_TOPIC0S[0]))

const oracleCalls = (calls: GetLogsFilter[]): GetLogsFilter[] =>
  calls.filter((c) => !(Array.isArray(c.topics[0]) ? (c.topics[0] as string[]) : []).includes(CONSENSUS_TOPIC0S[0]))

const consensusRanges = (endpoint: Endpoint): BlockRange[] =>
  consensusCalls(endpoint.getLogsCalls).map((call) => [call.fromBlock, call.toBlock])

/** The recent 30,000 blocks ending at `head`, as the three whole 10,000-block chunks. */
const tailOf = (head: number): BlockRange[] => [
  [head - 29_999, head - 20_000],
  [head - 19_999, head - 10_000],
  [head - 9_999, head],
]

/** A submission time (ms) that falls exactly on `block` of a chain with 5s blocks ending at `head`. */
const submittedAt = (head: number, block: number): number => (HEAD_TS - (head - block) * BLOCK_SECONDS) * 1000

// Builders emit empty oracleData, so their requestId derives from its keccak.
const requestIdFor = (epoch: string, oracle: string = ORACLE): string =>
  transactionProposalHash({
    chainId: CHAIN_ID,
    consensus: SAFENET_DEPLOYMENT.consensus,
    epoch,
    oracle,
    oracleDataHash: EMPTY_ORACLE_DATA_HASH as Hex,
    safeTxHash: SAFE_TX_HASH,
  })

const PENDING: RequestStateSpec = { state: 1 }
const SETTLED_APPROVED: RequestStateSpec = { state: 3, committed: 1, revealed: 1, approve: 1 }

const ONE_PENDING: Record<string, RequestStateSpec> = { [requestIdFor('1')]: PENDING }

const proposal = (blockNumber: number, over: LogOverrides = {}, logIndex = 0): RawLog =>
  buildOracleProposedLog(
    { safeTxHash: SAFE_TX_HASH, chainId: BigInt(HOME), safe: SAFE, epoch: 1n, oracle: ORACLE, ...over },
    { blockNumber, logIndex },
  )

const attestation = (blockNumber: number, over: LogOverrides = {}, logIndex = 0): RawLog =>
  buildOracleAttestedLog(
    { safeTxHash: SAFE_TX_HASH, chainId: BigInt(HOME), safe: SAFE, epoch: 1n, oracle: ORACLE, ...over },
    { blockNumber, logIndex },
  )

/** Built OUT OF ORDER so the reader's (blockNumber, logIndex) sort has teeth: the harness replays insertion order. */
const pairLogs = (): RawLog[] => {
  resetLogCounter()
  return [attestation(D + 200), proposal(D + 100, {}, 5)]
}

const lifecycleLogs = (requestId: string): RawLog[] => {
  resetLogCounter()
  return [
    proposal(D + 100),
    buildNewRequestLog({ requestId, revealDeadline: BigInt(D + 160) }, { blockNumber: D + 101, logIndex: 0 }),
    buildCommittedLog({ requestId, sentinel: SENTINEL }, { blockNumber: D + 102, logIndex: 0 }),
    buildRevealedLog({ requestId, sentinel: SENTINEL, approved: true }, { blockNumber: D + 103, logIndex: 0 }),
    buildOracleResultLog({ requestId, approved: true }, { blockNumber: D + 104, logIndex: 0 }),
    attestation(D + 105),
  ]
}

// No block time lands near 5,000,000s: the target sits in a gap of this chain's timestamps.
const pausedChain = (block: number): number => {
  const offset = block - D
  return offset <= 500_000 ? Math.max(0, offset) : 10_000_000 + (offset - 500_000) * 5
}

// 1s blocks around the target inside an otherwise 5.5s chain.
const mixedCadenceChain = (block: number): number => {
  const offset = block - D
  if (offset >= 400_000) return Math.floor(3_100_000 + 5.5 * (offset - 400_000))
  if (offset >= 300_000) return 3_000_000 + (offset - 300_000)
  return Math.max(0, Math.floor(3_000_000 - 5.5 * (300_000 - offset)))
}

/** Scenarios where a submission hint cannot place a window: [label, head, hint in ms, endpoint config]. */
const UNPLACEABLE_HINTS: Array<[string, number, number, Partial<RpcConfig>]> = [
  ['an estimate that never converges', D + 600_000, 5_000_000 * 1000, { timestampAt: pausedChain }],
  [
    'a local cadence far faster than the secant to the head',
    D + 1_000_000,
    3_050_000 * 1000,
    { timestampAt: mixedCadenceChain },
  ],
  ['block probes that return no block', D + 100_000, submittedAt(D + 100_000, D + 30_000), { failBlockProbes: 'null' }],
  ['block probes that error', D + 100_000, submittedAt(D + 100_000, D + 30_000), { failBlockProbes: 'error' }],
]

const BROKEN_DEPLOYMENTS: Array<[string, Partial<RpcConfig>, string]> = [
  ['serves another chain', { chainId: '11155111' }, 'RPC serves chain 11155111'],
  ['names another Coordinator', { coordinator: OTHER_ADDRESS }, 'Consensus coordinator does not match'],
  [
    'has an Oracle proposed by another Consensus',
    { proposer: OTHER_ADDRESS },
    'is not proposed by the configured Consensus',
  ],
]

const HEALTHY_DEPLOYMENT: Partial<RpcConfig> = {
  chainId: CHAIN_ID,
  coordinator: SAFENET_DEPLOYMENT.coordinator,
  proposer: SAFENET_DEPLOYMENT.consensus,
}

const makeReader = (over: Partial<SafenetReaderConfig> = {}, url = RPC_1) =>
  new SafenetReader({
    rpcUrls: [url],
    chainId: CHAIN_ID,
    consensus: SAFENET_DEPLOYMENT.consensus,
    coordinator: SAFENET_DEPLOYMENT.coordinator,
    oracles: [ORACLE],
    ...over,
  })

const read = (reader: SafenetReader, options: Partial<FetchCheckStateOptions> = {}) =>
  reader.fetchCheckState(SAFE_TX_HASH, { target: TARGET, ...options })

const endpointAt = (head: number, over: Partial<RpcConfig> = {}): Endpoint =>
  makeEndpoint({ url: RPC_1, head, headTimestamp: HEAD_TS, logs: [], ...over })

let server: SetupServerApi
afterEach(() => server?.close())

const serve = (...endpoints: Endpoint[]): void => {
  server = setupServer(...endpoints.map((endpoint) => endpoint.handler))
  server.listen()
}

describe('SafenetReader.fetchCheckState — discovery', () => {
  it('bootstraps from the chain head and returns the sorted, decoded Consensus events', async () => {
    const head = D + 25_000
    const endpoint = endpointAt(head, { logs: pairLogs(), requests: ONE_PENDING })
    serve(endpoint)

    const result = await read(makeReader())

    expect(result.headBlock).toBe(String(head))
    expect(result.headAtMs).toBe(HEAD_TS * 1000)
    expect(result.safeTxHash).toBe(SAFE_TX_HASH)
    expect(result.events.map((event) => [event.type, event.blockNumber])).toEqual([
      [CheckEventType.ORACLE_PROPOSED, D + 100],
      [CheckEventType.ORACLE_ATTESTED, D + 200],
    ])
    expect(result.requests.map((request) => request.requestId)).toEqual([requestIdFor('1')])
  })

  it('queries the Consensus contract by safeTxHash', async () => {
    const endpoint = endpointAt(D + 25_000, { logs: pairLogs(), requests: ONE_PENDING })
    serve(endpoint)

    await read(makeReader())

    const calls = consensusCalls(endpoint.getLogsCalls)
    expect(calls.length).toBeGreaterThan(0)
    for (const call of calls) {
      expect(call.address?.toLowerCase()).toBe(SAFENET_DEPLOYMENT.consensus.toLowerCase())
      expect(call.topics[1]).toBe(SAFE_TX_HASH)
    }
  })

  it('keeps only the events of the viewed Safe and home chain', async () => {
    resetLogCounter()
    const logs = [
      proposal(D + 100),
      proposal(D + 110, { epoch: 2n, safe: OTHER_SAFE }),
      proposal(D + 120, { epoch: 3n, chainId: 137n }),
      attestation(D + 130, { epoch: 2n, safe: OTHER_SAFE }),
    ]
    const endpoint = endpointAt(D + 25_000, { logs, requests: ONE_PENDING })
    serve(endpoint)

    const result = await read(makeReader())

    expect(result.events.map((event) => event.blockNumber)).toEqual([D + 100])
    expect(result.requests.map((request) => request.requestId)).toEqual([requestIdFor('1')])
  })

  it('matches the Oracle allowlist case-insensitively', async () => {
    const endpoint = endpointAt(D + 25_000, { logs: pairLogs(), requests: ONE_PENDING })
    serve(endpoint)

    const result = await read(makeReader({ oracles: [ORACLE.toLowerCase()] }))

    expect(result.requests.map((request) => request.requestId)).toEqual([requestIdFor('1')])
  })
})

describe('SafenetReader.fetchCheckState — Oracle evidence', () => {
  it('merges the Oracle lifecycle into the event stream sorted by log position', async () => {
    const requestId = requestIdFor('1')
    const endpoint = endpointAt(D + 25_000, {
      logs: lifecycleLogs(requestId),
      requests: { [requestId]: SETTLED_APPROVED },
    })
    serve(endpoint)

    const result = await read(makeReader())

    expect(result.events.map((event) => event.type)).toEqual([
      CheckEventType.ORACLE_PROPOSED,
      CheckEventType.REQUEST_CREATED,
      CheckEventType.SENTINEL_COMMITTED,
      CheckEventType.SENTINEL_REVEALED,
      CheckEventType.ORACLE_RESULT,
      CheckEventType.ORACLE_ATTESTED,
    ])
  })

  it('returns a Redux-serializable result — no bigints survive the read', async () => {
    const requestId = requestIdFor('1')
    const endpoint = endpointAt(D + 25_000, {
      logs: lifecycleLogs(requestId),
      requests: { [requestId]: SETTLED_APPROVED },
    })
    serve(endpoint)

    const result = await read(makeReader())

    expect(result.requests[0].votes).toHaveLength(1)
    expect(result.candidates).toHaveLength(1)
    expect(JSON.parse(JSON.stringify(result))).toEqual(result)
  })
})

describe('SafenetReader.fetchCheckState — input validation', () => {
  it('rejects a malformed safeTxHash before touching any endpoint', async () => {
    const endpoint = endpointAt(D + 25_000)
    serve(endpoint)

    await expect(makeReader().fetchCheckState('0xnot-a-hash', { target: TARGET })).rejects.toThrow('invalid safeTxHash')
    expect(endpoint.methods).toHaveLength(0)
  })

  it.each([
    ['an empty home chain id', { chainId: '', safeAddress: SAFE }],
    ['a Safe address that is not an address', { chainId: HOME, safeAddress: '0xnot-an-address' }],
  ])('rejects %s before touching any endpoint', async (_label, target) => {
    const endpoint = endpointAt(D + 25_000)
    serve(endpoint)

    await expect(makeReader().fetchCheckState(SAFE_TX_HASH, { target })).rejects.toThrow('invalid check target')
    expect(endpoint.methods).toHaveLength(0)
  })
})

describe('SafenetReader getLogs windows', () => {
  it('reads the recent 30k blocks as three whole 10k-block chunks', async () => {
    const endpoint = endpointAt(D + 45_000)
    serve(endpoint)

    await read(makeReader())

    expect(consensusRanges(endpoint)).toEqual([
      [D + 15_001, D + 25_000],
      [D + 25_001, D + 35_000],
      [D + 35_001, D + 45_000],
    ])
  })

  it('never reads below the deployment block', async () => {
    const endpoint = endpointAt(D + 25_000)
    serve(endpoint)

    await read(makeReader())

    expect(endpoint.getLogsCalls.map((call) => call.fromBlock).every((from) => from >= D)).toBe(true)
    expect(consensusRanges(endpoint)).toEqual([
      [D, D + 9_999],
      [D + 10_000, D + 19_999],
      [D + 20_000, D + 25_000],
    ])
  })

  it('adds the recent tail when the aimed window stops short of the head', async () => {
    const head = D + 100_000
    const aimedBlock = D + 50_000
    const endpoint = endpointAt(head)
    serve(endpoint)

    await read(makeReader(), { timestampMs: submittedAt(head, aimedBlock) })

    expect(consensusRanges(endpoint)).toEqual([[aimedBlock - 1_000, aimedBlock + 8_999], ...tailOf(head)])
  })

  it.each([
    ['inside the recent tail', 20_000, (head: number): BlockRange[] => tailOf(head)],
    [
      'overlapping the start of the recent tail',
      35_000,
      (head: number): BlockRange[] => [
        [head - 36_000, head - 26_001],
        [head - 26_000, head - 16_001],
        [head - 16_000, head - 6_001],
        [head - 6_000, head],
      ],
    ],
  ])('merges an aimed window %s without reading any block twice', async (_label, blocksBehindHead, expected) => {
    const head = D + 100_000
    const endpoint = endpointAt(head)
    serve(endpoint)

    await read(makeReader(), { timestampMs: submittedAt(head, head - blocksBehindHead) })

    expect(consensusRanges(endpoint)).toEqual(expected(head))
  })

  it('keeps at most three getLogs in flight', async () => {
    const head = D + 100_000
    const endpoint = endpointAt(head, { gateLogs: true })
    serve(endpoint)
    const bodies: Array<Promise<RpcBody | RpcBody[]>> = []
    server.events.on('request:start', ({ request }) => {
      bodies.push(request.clone().json())
    })

    const reading = read(makeReader(), { timestampMs: submittedAt(head, D + 50_000) })
    await endpoint.gate.logsArrived
    const held = (await Promise.all(bodies)).flat().filter(({ method }) => method === 'eth_getLogs')
    endpoint.gate.releaseLogs()
    await reading

    expect(held).toHaveLength(3)
    expect(endpoint.getLogsCalls).toHaveLength(4)
  })
})

describe('SafenetReader endpoint rotation', () => {
  const upAt = (url: string) => endpointAt(D + 25_000, { url, logs: pairLogs(), requests: ONE_PENDING })

  it('propagates the failure when every RPC endpoint is down', async () => {
    const endpoint = makeEndpoint({ url: RPC_1, failEverything: true })
    serve(endpoint)

    await expect(read(makeReader())).rejects.toThrow()
    expect(endpoint.methods.length).toBeGreaterThan(0)
  })

  it('rotates to the next endpoint when the first one fails', async () => {
    const down = makeEndpoint({ url: RPC_1, failEverything: true })
    const up = upAt(RPC_2)
    serve(down, up)

    const result = await read(makeReader({ rpcUrls: [RPC_1, RPC_2] }))

    expect(result.headBlock).toBe(String(D + 25_000))
    expect(up.methods.length).toBeGreaterThan(0)
  })

  it('survives concurrent reads racing failing endpoints — rotation is not double-applied', async () => {
    const down1 = makeEndpoint({ url: RPC_1, failEverything: true })
    const down2 = makeEndpoint({ url: RPC_2, failEverything: true })
    serve(down1, down2, upAt(RPC_3))
    const reader = makeReader({ rpcUrls: [RPC_1, RPC_2, RPC_3] })

    const results = await Promise.all([read(reader), read(reader), read(reader)])

    for (const result of results) expect(result.headBlock).toBe(String(D + 25_000))
  })

  it('does not cancel a concurrent read when one call fails on the shared endpoint', async () => {
    const endpoint = endpointAt(D + 25_000, {
      logs: pairLogs(),
      requests: ONE_PENDING,
      failBlockProbes: 'error',
      gateLogs: true,
    })
    serve(endpoint)
    const reader = makeReader()

    const sibling = read(reader)
    await endpoint.gate.logsArrived
    // A numeric header probe rejects, so this call rotates while the sibling's getLogs is on the wire.
    expect(await reader.blockTimeMs(500)).toBeNull()
    endpoint.gate.releaseLogs()

    await expect(sibling).resolves.toMatchObject({ headBlock: String(D + 25_000) })
  })

  it('keeps the rotated endpoint for the next read instead of retrying the failed one', async () => {
    const down = makeEndpoint({ url: RPC_1, failEverything: true })
    serve(down, upAt(RPC_2))
    const reader = makeReader({ rpcUrls: [RPC_1, RPC_2] })

    await read(reader)
    const attemptsOnDown = down.methods.length
    await read(reader)

    expect(attemptsOnDown).toBeGreaterThan(0)
    expect(down.methods.length).toBe(attemptsOnDown)
  })
})

describe('SafenetReader Oracle allowlist', () => {
  it.each([
    ['proposals', proposal],
    ['attestations', attestation],
  ])('ignores %s that name an Oracle outside the allowlist', async (_family, build) => {
    const endpoint = endpointAt(D + 25_000, { logs: [build(D + 100, { oracle: UNLISTED_ORACLE })] })
    serve(endpoint)

    const result = await read(makeReader())

    expect(result.requests).toEqual([])
    expect(result.events).toEqual([])
    expect(result.candidates).toEqual([])
    expect(oracleCalls(endpoint.getLogsCalls)).toHaveLength(0)
    expect(callsTo(endpoint, [GET_REQUEST])).toHaveLength(0)
  })

  it('scans each allowlisted Oracle once for all of its requests and never reads an unlisted one', async () => {
    resetLogCounter()
    const ids = { first: requestIdFor('1'), second: requestIdFor('2'), other: requestIdFor('1', OTHER_ORACLE) }
    const logs = [
      proposal(D + 100),
      proposal(D + 105, { epoch: 2n }),
      proposal(D + 110, { oracle: OTHER_ORACLE }),
      proposal(D + 115, { oracle: UNLISTED_ORACLE }),
    ]
    const endpoint = endpointAt(D + 5_000, {
      logs,
      requests: { [ids.first]: PENDING, [ids.second]: PENDING, [ids.other]: PENDING },
    })
    serve(endpoint)

    await read(makeReader({ oracles: [ORACLE, OTHER_ORACLE] }))

    const scans = oracleCalls(endpoint.getLogsCalls)
    const idsByOracle = new Map(scans.map((call) => [call.address?.toLowerCase(), call.topics[1] as string[]]))
    expect(scans).toHaveLength(2)
    expect([...(idsByOracle.get(ORACLE.toLowerCase()) ?? [])].sort()).toEqual([ids.first, ids.second].sort())
    expect(idsByOracle.get(OTHER_ORACLE.toLowerCase())).toEqual([ids.other])
  })

  it('drops sentinel logs a non-allowlisted contract emitted for a real request id', async () => {
    resetLogCounter()
    const requestId = requestIdFor('1')
    const logs = [
      proposal(D + 100),
      { ...buildOracleResultLog({ requestId, approved: false }, { blockNumber: D + 200 }), address: ATTACKER },
      { ...buildRevealedLog({ requestId, approved: false }, { blockNumber: D + 201 }), address: ATTACKER },
    ]
    const endpoint = endpointAt(D + 25_000, { logs, requests: ONE_PENDING })
    serve(endpoint)

    const result = await read(makeReader())

    expect(result.events.map((event) => event.type)).toEqual([CheckEventType.ORACLE_PROPOSED])
    expect(result.requests[0].votes).toEqual([])
  })
})

describe('SafenetReader block targeting', () => {
  const head = D + 1_000_000

  it.each([
    ['a week old', 120_960],
    ['a year old', 6_307_200],
  ])('reads a check that is %s as one aimed window plus the recent tail', async (_label, ageInBlocks) => {
    const farHead = D + 7_000_000
    const aimedBlock = farHead - ageInBlocks
    const endpoint = endpointAt(farHead)
    serve(endpoint)

    await read(makeReader(), { timestampMs: submittedAt(farHead, aimedBlock) })

    expect(consensusRanges(endpoint)).toEqual([[aimedBlock - 1_000, aimedBlock + 8_999], ...tailOf(farHead)])
  })

  it('returns the events inside an aimed window, up to its forward edge', async () => {
    resetLogCounter()
    const centre = D + 500_000
    const logs = [
      attestation(centre - 1_001),
      proposal(centre),
      attestation(centre + 8_999),
      attestation(centre + 9_000),
    ]
    const endpoint = endpointAt(head, { logs, requests: ONE_PENDING })
    serve(endpoint)

    const result = await read(makeReader(), { timestampMs: submittedAt(head, centre) })

    expect(result.events.map((event) => event.blockNumber)).toEqual([centre, centre + 8_999])
  })

  it.each([
    ['at the head', 0],
    ['300s past the head', 300],
    ['30,000s past the head', 30_000],
  ])('pins the window to the head for a timestamp %s', async (_label, secondsPastHead) => {
    const endpoint = endpointAt(head)
    serve(endpoint)

    await read(makeReader(), { timestampMs: (HEAD_TS + secondsPastHead) * 1000 })

    expect(consensusRanges(endpoint)).toEqual([[head - 1_000, head]])
  })

  it('clamps an aimed window at the deployment block without proving the gap before the tail', async () => {
    const nearHead = D + 100_000
    const endpoint = endpointAt(nearHead)
    serve(endpoint)

    const result = await read(makeReader(), { timestampMs: submittedAt(nearHead, D + 500) })

    expect(consensusRanges(endpoint)).toEqual([[D, D + 9_499], ...tailOf(nearHead)])
    expect(result.windowCoverage).toBe('heuristic')
  })

  it('drops an aimed window that lies wholly below the deployment block', async () => {
    const nearHead = D + 100_000
    const endpoint = endpointAt(nearHead)
    serve(endpoint)

    await read(makeReader(), { timestampMs: submittedAt(nearHead, D - 10_000) })

    expect(consensusRanges(endpoint)).toEqual(tailOf(nearHead))
    expect(endpoint.getLogsCalls.every((call) => call.fromBlock >= D)).toBe(true)
  })
})

describe('SafenetReader block targeting — estimate convergence', () => {
  it('converges on a chain whose real block time drifted from the nominal 5s', async () => {
    // 10s blocks: the nominal-seeded first guess lands 100,000 blocks off; one probe measures the real cadence.
    const head = D + 1_000_000
    const endpoint = endpointAt(head, { blockTimeSeconds: 10 })
    serve(endpoint)

    await read(makeReader(), { timestampMs: (HEAD_TS - 1_000_000) * 1000 })

    expect(consensusRanges(endpoint)).toEqual([[D + 899_000, D + 908_999], ...tailOf(head)])
  })

  it.each(UNPLACEABLE_HINTS)(
    'falls back to the head-relative scan for %s',
    async (_label, head, timestampMs, config) => {
      const endpoint = endpointAt(head, config)
      serve(endpoint)

      const result = await read(makeReader(), { timestampMs })

      expect(result.headBlock).toBe(String(head))
      expect(consensusRanges(endpoint)).toEqual(tailOf(head))
    },
  )

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('ignores a %s timestamp exactly as if none were given', async (_label, timestampMs) => {
    const head = D + 45_000
    const hinted = endpointAt(head)
    const unhinted = endpointAt(head, { url: RPC_2 })
    serve(hinted, unhinted)

    await read(makeReader(), { timestampMs })
    await read(makeReader({}, RPC_2))

    const [hintedReads, unhintedReads] = [hinted, unhinted].map(
      ({ methods }) => methods.filter((method) => method === 'eth_getBlockByNumber').length,
    )
    expect(hintedReads).toBe(unhintedReads)
    expect(consensusRanges(hinted)).toEqual(consensusRanges(unhinted))
  })
})

describe('SafenetReader window coverage', () => {
  it.each([
    ['no hint', undefined],
    ['a hint inside the tail', submittedAt(D + 25_000, D + 10_000)],
  ])('proves a head within one lookback window of the deployment (%s)', async (_label, timestampMs) => {
    const endpoint = endpointAt(D + 25_000)
    serve(endpoint)

    const result = await read(makeReader(), { timestampMs })

    expect(result.windowCoverage).toBe('proven')
    expect(result.requests).toEqual([])
    expect(result.evidenceComplete).toBe(true)
  })

  it.each([
    ['29,999 blocks above the deployment', 29_999, 'proven'],
    ['30,000 blocks above the deployment', 30_000, 'heuristic'],
  ])('covers the deployment block only while the head is %s', async (_label, blocksAbove, coverage) => {
    const endpoint = endpointAt(D + blocksAbove)
    serve(endpoint)

    const result = await read(makeReader())

    expect(result.windowCoverage).toBe(coverage)
  })

  it('does not claim absence from a head-relative scan beyond the deployment', async () => {
    const endpoint = endpointAt(D + 45_000)
    serve(endpoint)

    const result = await read(makeReader())

    expect(result.windowCoverage).toBe('heuristic')
    expect(result.requests).toEqual([])
    expect(result.evidenceComplete).toBe(false)
  })

  it('cannot prove an aimed window that stops short of the head', async () => {
    const head = D + 1_000_000
    const endpoint = endpointAt(head)
    serve(endpoint)

    const result = await read(makeReader(), { timestampMs: submittedAt(head, D + 500_000) })

    expect(result.windowCoverage).toBe('heuristic')
    expect(result.evidenceComplete).toBe(false)
  })

  it.each(UNPLACEABLE_HINTS)('cannot prove a window placed with %s', async (_label, head, timestampMs, config) => {
    const endpoint = endpointAt(head, config)
    serve(endpoint)

    const result = await read(makeReader(), { timestampMs })

    expect(result.windowCoverage).toBe('heuristic')
  })

  // A hint that places a window running to the head must not prove absence: only the ranges can.
  it.each([
    ['30,000s ahead of the head', -30_000],
    ['300s ahead of the head', -300],
    ['exactly BLOCK_ESTIMATE_TOLERANCE_SECONDS ahead of the head', -BLOCK_ESTIMATE_TOLERANCE_SECONDS],
    ['300s behind the head', 300],
    ['exactly BLOCK_ESTIMATE_TOLERANCE_SECONDS behind the head', BLOCK_ESTIMATE_TOLERANCE_SECONDS],
  ])('never proves absence from a hint alone (%s)', async (_label, secondsBehindHead) => {
    const head = D + 1_000_000
    const endpoint = endpointAt(head)
    serve(endpoint)

    const result = await read(makeReader(), { timestampMs: (HEAD_TS - secondsBehindHead) * 1000 })

    const blocksBehind = Math.max(0, secondsBehindHead) / BLOCK_SECONDS
    expect(consensusRanges(endpoint)).toEqual([[head - blocksBehind - 1_000, head]])
    expect(result.windowCoverage).toBe('heuristic')
    expect(result.evidenceComplete).toBe(false)
  })
})

describe('SafenetReader deployment validation', () => {
  it.each(BROKEN_DEPLOYMENTS)('rejects an endpoint that %s before reading any log', async (_label, broken, message) => {
    const endpoint = endpointAt(D + 25_000, { logs: pairLogs(), requests: ONE_PENDING, ...broken })
    serve(endpoint)

    await expect(read(makeReader())).rejects.toThrow(message)
    expect(endpoint.getLogsCalls).toHaveLength(0)
    expect(callsTo(endpoint, [GET_REQUEST])).toHaveLength(0)
  })

  it('rotates past an endpoint that fails validation and is served by the next one', async () => {
    const wrong = endpointAt(D + 90_000, { url: RPC_1, chainId: '11155111', logs: pairLogs(), requests: ONE_PENDING })
    const right = endpointAt(D + 25_000, { url: RPC_2, logs: pairLogs(), requests: ONE_PENDING })
    serve(wrong, right)

    const result = await read(makeReader({ rpcUrls: [RPC_1, RPC_2] }))

    expect(result.headBlock).toBe(String(D + 25_000))
    expect(wrong.getLogsCalls).toHaveLength(0)
  })

  it('validates a provider once — a second read does not repeat the linkage calls', async () => {
    const endpoint = endpointAt(D + 25_000)
    serve(endpoint)
    const reader = makeReader()

    await read(reader)
    const validated = callsTo(endpoint, LINKAGE_SELECTORS).length
    await read(reader)

    expect(validated).toBeGreaterThan(0)
    expect(callsTo(endpoint, LINKAGE_SELECTORS)).toHaveLength(validated)
  })

  it('shares one in-flight validation between concurrent first reads', async () => {
    const endpoint = endpointAt(D + 25_000)
    serve(endpoint)
    const reader = makeReader()

    await Promise.all([read(reader), read(reader), read(reader)])

    expect(callsTo(endpoint, [GET_COORDINATOR])).toHaveLength(1)
  })

  // Revert data does not rotate the provider, so the retry runs on the provider whose validation failed.
  it('retries the validation on the same endpoint after a failure that does not rotate it', async () => {
    const config: RpcConfig = { url: RPC_1, head: D + 25_000, revertCoordinator: true }
    const endpoint = makeEndpoint(config)
    serve(endpoint)
    const reader = makeReader()

    await expect(read(reader)).rejects.toMatchObject({ code: 'CALL_EXCEPTION' })
    expect(endpoint.getLogsCalls).toHaveLength(0)
    expect(callsTo(endpoint, [GET_REQUEST])).toHaveLength(0)
    config.revertCoordinator = false

    await expect(read(reader)).resolves.toMatchObject({ headBlock: String(D + 25_000) })
  })
})

describe('SafenetReader.loadGroupKey — deployment validation', () => {
  it.each(BROKEN_DEPLOYMENTS)(
    'rejects an endpoint that %s before any group-key read and caches nothing',
    async (_label, broken, message) => {
      const config: RpcConfig = {
        url: RPC_1,
        head: D + 25_000,
        epochGroupId: GROUP_ID,
        groupKey: GROUP_KEY,
        ...broken,
      }
      const endpoint = makeEndpoint(config)
      serve(endpoint)
      const reader = makeReader()

      await expect(reader.loadGroupKey(GROUP_EPOCH)).rejects.toThrow(message)
      expect(callsTo(endpoint, GROUP_KEY_SELECTORS)).toHaveLength(0)

      Object.assign(config, HEALTHY_DEPLOYMENT)
      await expect(reader.loadGroupKey(GROUP_EPOCH)).resolves.toEqual(GROUP_KEY)
      expect(callsTo(endpoint, GROUP_KEY_SELECTORS).length).toBeGreaterThan(0)
    },
  )

  it('does not answer from the group-key cache through an endpoint that fails validation', async () => {
    const trusted: RpcConfig = { url: RPC_1, head: D + 25_000, epochGroupId: GROUP_ID, groupKey: GROUP_KEY }
    const wrong = endpointAt(D + 25_000, {
      url: RPC_2,
      chainId: '11155111',
      epochGroupId: GROUP_ID,
      groupKey: GROUP_KEY,
    })
    serve(makeEndpoint(trusted), wrong)
    const reader = makeReader({ rpcUrls: [RPC_1, RPC_2] })
    await reader.loadGroupKey(GROUP_EPOCH)
    trusted.failEverything = true
    // The header read fails on the trusted endpoint and rotates the reader onto the wrong-chain one.
    await reader.blockTimeMs(10)

    await expect(reader.loadGroupKey(GROUP_EPOCH)).rejects.toThrow()
    expect(callsTo(wrong, GROUP_KEY_SELECTORS)).toHaveLength(0)
  })
})

describe('SafenetReader pinned deployment', () => {
  const pinned: PinnedConfig = {
    chainId: SAFENET_DEPLOYMENT.chainId,
    consensus: SAFENET_DEPLOYMENT.consensus,
    coordinator: SAFENET_DEPLOYMENT.coordinator,
    oracles: [...SAFENET_DEPLOYMENT.oracles],
  }

  it('accepts the pinned manifest in any address case', () => {
    expect(() => assertPinnedDeployment(pinned)).not.toThrow()
    expect(() =>
      assertPinnedDeployment({
        chainId: pinned.chainId,
        consensus: pinned.consensus.toLowerCase(),
        coordinator: pinned.coordinator.toUpperCase().replace('0X', '0x'),
        oracles: pinned.oracles.map((address) => address.toLowerCase()),
      }),
    ).not.toThrow()
  })

  it.each<[string, Partial<PinnedConfig>]>([
    ['another chain', { chainId: '11155111' }],
    ['another Consensus', { consensus: OTHER_ADDRESS }],
    ['another Coordinator', { coordinator: OTHER_ADDRESS }],
    ['an extra Oracle', { oracles: [...pinned.oracles, OTHER_ORACLE] }],
    ['no Oracle', { oracles: [] }],
    ['a different Oracle', { oracles: [OTHER_ORACLE] }],
  ])('rejects a configuration with %s', (_label, change) => {
    expect(() => assertPinnedDeployment({ ...pinned, ...change })).toThrow(
      'deployment configuration does not match the latest Gnosis deployment',
    )
  })

  it('refuses to build a reader for another chain', () => {
    expect(() => makeReader({ chainId: '11155111' })).toThrow('only Gnosis Chain (100) is supported')
  })

  it('refuses to build a reader with an empty Oracle allowlist', () => {
    expect(() => makeReader({ oracles: [] })).toThrow('the Oracle allowlist must not be empty')
  })
})

describe('getSafenetReader — the deployment configured through the environment', () => {
  const MISMATCH = 'deployment configuration does not match the latest Gnosis deployment'
  const PLATFORM_PREFIXES = ['NEXT_PUBLIC', 'EXPO_PUBLIC']
  const envKeys = (setting: string): string[] => PLATFORM_PREFIXES.map((prefix) => `${prefix}_SAFENET_${setting}`)
  const DEPLOYMENT_KEYS = ['CHAIN_ID', 'CONSENSUS_ADDRESS', 'COORDINATOR_ADDRESS', 'ORACLE_ADDRESSES'].flatMap(envKeys)

  const BLANK_VALUES: Array<[string, string]> = [
    ['empty', ''],
    ['whitespace-only', '   '],
  ]
  const BLANK_CASES = ['CONSENSUS_ADDRESS', 'COORDINATOR_ADDRESS', 'ORACLE_ADDRESSES']
    .flatMap(envKeys)
    .flatMap((key) => BLANK_VALUES.map(([kind, value]): [string, string, string] => [key, kind, value]))

  const OTHER_DEPLOYMENT: Record<string, string> = {
    CHAIN_ID: '11155111',
    CONSENSUS_ADDRESS: OTHER_ADDRESS,
    COORDINATOR_ADDRESS: OTHER_ADDRESS,
    ORACLE_ADDRESSES: OTHER_ORACLE,
  }
  const MISMATCH_CASES = Object.entries(OTHER_DEPLOYMENT).flatMap(([setting, value]) =>
    envKeys(setting).map((key): [string, string] => [key, value]),
  )

  const outsideEnv = new Map<string, string | undefined>()

  beforeEach(() => {
    DEPLOYMENT_KEYS.forEach((key) => {
      outsideEnv.set(key, process.env[key])
      delete process.env[key]
    })
  })

  afterEach(() => {
    outsideEnv.forEach((value, key) => {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    })
  })

  // The constants read the environment when the module loads, so each case loads its own copy of the reader module.
  const loadWith = (env: Record<string, string>): ReaderModule => {
    Object.assign(process.env, env)
    let loaded!: ReaderModule
    jest.isolateModules(() => {
      loaded = jest.requireActual<ReaderModule>('../safenetReader')
    })
    return loaded
  }

  it('builds one process-wide reader when no deployment is configured', () => {
    const { getSafenetReader, SafenetReader: IsolatedReader } = loadWith({})

    const reader = getSafenetReader()

    expect(reader).toBeInstanceOf(IsolatedReader)
    expect(getSafenetReader()).toBe(reader)
  })

  it.each(BLANK_CASES)('uses the pinned deployment when %s is %s', (key, _kind, value) => {
    const { getSafenetReader, SafenetReader: IsolatedReader } = loadWith({ [key]: value })

    expect(getSafenetReader()).toBeInstanceOf(IsolatedReader)
  })

  it.each(MISMATCH_CASES)('fails closed, every time, when %s names another deployment', (key, value) => {
    const { getSafenetReader } = loadWith({ [key]: value })

    expect(() => getSafenetReader()).toThrow(MISMATCH)
    expect(() => getSafenetReader()).toThrow(MISMATCH)
  })
})

describe('SafenetReader lagging endpoints', () => {
  it('rejects an endpoint whose head is below the previous read', async () => {
    const endpoint = endpointAt(D + 100)
    serve(endpoint)

    await expect(read(makeReader(), { minimumBlock: D + 101 })).rejects.toThrow('endpoint is behind the previous read')
    expect(endpoint.getLogsCalls).toHaveLength(0)
  })

  it('accepts an endpoint whose head equals the previous read', async () => {
    serve(endpointAt(D + 100))

    await expect(read(makeReader(), { minimumBlock: D + 100 })).resolves.toMatchObject({ headBlock: String(D + 100) })
  })

  it('rotates past a lagging endpoint to one that has caught up', async () => {
    serve(endpointAt(D + 100, { url: RPC_1 }), endpointAt(D + 200, { url: RPC_2 }))

    const result = await read(makeReader({ rpcUrls: [RPC_1, RPC_2] }), { minimumBlock: D + 150 })

    expect(result.headBlock).toBe(String(D + 200))
  })

  it('rejects an endpoint whose head predates the deployment', async () => {
    const endpoint = endpointAt(D - 1)
    serve(endpoint)

    await expect(read(makeReader())).rejects.toThrow('endpoint head predates deployment')
    expect(endpoint.getLogsCalls).toHaveLength(0)
  })

  it('reads a head at the deployment block', async () => {
    const endpoint = endpointAt(D)
    serve(endpoint)

    const result = await read(makeReader())

    expect(consensusRanges(endpoint)).toEqual([[D, D]])
    expect(result.windowCoverage).toBe('proven')
  })
})
