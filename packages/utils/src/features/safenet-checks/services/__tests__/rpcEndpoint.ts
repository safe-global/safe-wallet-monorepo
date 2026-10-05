import { http, HttpResponse, type HttpHandler } from 'msw'
import { Interface, ZeroHash } from 'ethers'
import { CONSENSUS_READ_ABI, COORDINATOR_READ_ABI, ORACLE_READ_ABI } from '../../abi'
import { SAFENET_DEPLOYMENT } from '../../constants'
import type { RawLog } from '../../utils/decodeLogs'

/**
 * Fake JSON-RPC endpoint for reader tests (msw). Answers real JSON-RPC shapes —
 * single and batched bodies — so the reader is exercised through an actual
 * ethers `JsonRpcProvider`, not a mocked one. Contract reads are answered by
 * ABI-encoding through the deployed view ABIs, so the decode path under test is
 * the production one.
 *
 * Not a test file: `testMatch` only picks `*.test.ts`.
 */

export type GetLogsFilter = { address?: string; topics: unknown[]; fromBlock: number; toBlock: number }

/** One `eth_call` the endpoint saw, with the block tag the reader pinned it to. */
export type EthCall = { to: string; selector: string; blockTag: unknown }

/**
 * What `getRequest(requestId)` answers. Counts and deadlines default to 0. `raw`
 * answers verbatim ABI bytes (a real capture) instead of encoding a spec.
 */
export type RequestStateSpec =
  | {
      state: number
      commitDeadline?: number
      revealDeadline?: number
      arbitrationDeadline?: number
      committed?: number
      revealed?: number
      approve?: number
      deny?: number
    }
  | { raw: string }

export type RpcConfig = {
  url: string
  chainId?: string
  head?: number
  headTimestamp?: number
  /** Seconds between consecutive blocks (default 5, the nominal Gnosis cadence). */
  blockTimeSeconds?: number
  /** Nonlinear cadence: unix timestamp for block `n`. Wins over `blockTimeSeconds`. */
  timestampAt?: (blockNumber: number) => number
  /**
   * Hash of block `number`. `probeIndex` counts the `eth_getBlockByNumber` calls
   * so far, so a test can flip the hash between the head read and the end-of-read
   * probe to model a reorg. Defaults to one stable hash.
   */
  blockHash?: (number: number, probeIndex: number) => string
  logs?: RawLog[]
  /**
   * How numeric `eth_getBlockByNumber` probes fail. `'null'` answers "block not
   * found". `'error'` answers a JSON-RPC error, which is what a load-balanced
   * node returns for an old header it cannot serve, and which rejects in ethers
   * rather than resolving to null. The head block itself is always served.
   */
  failBlockProbes?: 'null' | 'error'
  failEverything?: boolean
  /** `getEpochGroupId(epoch)` result. */
  epochGroupId?: string
  /** `coordinator.groupKey(gid)` result. */
  groupKey?: { x: string; y: string }
  /** `groupKey` calls revert (an epoch the coordinator has not seen). */
  failGroupKey?: boolean
  /** `Consensus.getCoordinator()` result. Defaults to the pinned Gnosis Coordinator. */
  coordinator?: string
  /** `getCoordinator()` reverts with revert data, so the failure does not rotate the provider. */
  revertCoordinator?: boolean
  /** `Oracle.PROPOSER()` result for every Oracle. Defaults to the pinned Gnosis Consensus. */
  proposer?: string
  /**
   * `getRequest` answers by lowercase requestId. A request listed as `'not-found'`
   * — or not listed at all — reverts with the contract's `RequestNotFound()`.
   * `{ revert }` reverts with the given 4-byte selector as revert data instead.
   */
  requests?: Record<string, RequestStateSpec | 'not-found' | { revert: string }>
  /** `getRequest` fails with a JSON-RPC error that carries no revert data. */
  failRequests?: boolean
  /** `getAttestationSignatureId(requestId)` answers by lowercase requestId; unlisted is the zero id. */
  signatureIds?: Record<string, string>
  /** `getTransactionAttestationByHash` answer, for every call. */
  attestation?: { r: { x: string; y: string }; z: string }
  /** `getAttestationSignatureId` / `getTransactionAttestationByHash` fail without revert data. */
  failAttestationGetters?: boolean
  /** Hold `eth_getLogs` responses until the returned gate releases them. */
  gateLogs?: boolean
  /** A faulty node: `eth_getLogs` ignores the indexed topics after the event signature. */
  ignoreIndexedTopics?: boolean
}

const hexToNum = (value: string): number => Number(BigInt(value))

const consensusRead = new Interface([...CONSENSUS_READ_ABI])
const coordinatorRead = new Interface([...COORDINATOR_READ_ABI])
const oracleRead = new Interface([...ORACLE_READ_ABI])

const selectorOf = (iface: Interface, name: string): string => iface.getFunction(name)!.selector

/** A JSON-RPC error answer. Revert data, when given, is what ethers decodes a CALL_EXCEPTION from. */
class RpcError extends Error {
  constructor(
    message: string,
    readonly code = 3,
    readonly data?: string,
  ) {
    super(message)
  }
}

const encodeRequest = (spec: RequestStateSpec): string => {
  if ('raw' in spec) return spec.raw
  const s = {
    commitDeadline: 0,
    revealDeadline: 0,
    arbitrationDeadline: 0,
    committed: 0,
    revealed: 0,
    approve: 0,
    deny: 0,
    ...spec,
  }
  const terms = [s.commitDeadline, 0, s.revealDeadline, 0n, 0, '0x' + '00'.repeat(20), 0n]
  const progress = [s.state, 0n, s.arbitrationDeadline, s.committed, s.revealed, s.approve, s.deny, 0]
  return oracleRead.encodeFunctionResult('getRequest', [[terms, progress]])
}

const filterLogs = (logs: RawLog[], filter: GetLogsFilter): RawLog[] => {
  const topic0s = (Array.isArray(filter.topics[0]) ? filter.topics[0] : [filter.topics[0]]) as string[]
  const topic1s =
    filter.topics[1] == null
      ? null
      : ((Array.isArray(filter.topics[1]) ? filter.topics[1] : [filter.topics[1]]) as string[])
  return logs.filter((log) => {
    if (filter.address && (log.address ?? '').toLowerCase() !== filter.address.toLowerCase()) return false
    if (!topic0s.includes(log.topics[0])) return false
    if (topic1s && !topic1s.includes(log.topics[1])) return false
    return log.blockNumber >= filter.fromBlock && log.blockNumber <= filter.toBlock
  })
}

/** Onto the wire shape ethers parses back into `Log`s. */
const toWireLog = (log: RawLog) => ({
  address: log.address ?? '0x' + 'aa'.repeat(20),
  topics: log.topics,
  data: log.data,
  blockNumber: '0x' + log.blockNumber.toString(16),
  transactionHash: log.transactionHash,
  transactionIndex: '0x0',
  blockHash: '0x' + '11'.repeat(32),
  logIndex: '0x' + log.logIndex.toString(16),
  removed: false,
})

/** The 32-byte first argument of a view call, as a lowercase requestId. */
const requestIdArg = (data: string): string => ('0x' + data.slice(10, 74)).toLowerCase()

type CallHandler = (config: RpcConfig, data: string) => string

/** Contract reads by selector, answered through the deployed view ABIs. */
const CALL_HANDLERS: Record<string, CallHandler> = {
  [selectorOf(consensusRead, 'getEpochGroupId')]: (config) =>
    consensusRead.encodeFunctionResult('getEpochGroupId', [config.epochGroupId ?? ZeroHash]),
  [selectorOf(consensusRead, 'getCoordinator')]: (config) => {
    if (config.revertCoordinator) throw new RpcError('execution reverted', 3, '0xdeadbeef')
    return consensusRead.encodeFunctionResult('getCoordinator', [config.coordinator ?? SAFENET_DEPLOYMENT.coordinator])
  },
  [selectorOf(oracleRead, 'PROPOSER')]: (config) =>
    oracleRead.encodeFunctionResult('PROPOSER', [config.proposer ?? SAFENET_DEPLOYMENT.consensus]),
  [selectorOf(coordinatorRead, 'groupKey')]: (config) => {
    if (config.failGroupKey) throw new RpcError('group key not ready')
    const { x, y } = config.groupKey ?? { x: '1', y: '2' }
    return coordinatorRead.encodeFunctionResult('groupKey', [[BigInt(x), BigInt(y)]])
  },
  [selectorOf(oracleRead, 'getRequest')]: (config, data) => {
    if (config.failRequests) throw new RpcError('request read failed')
    const spec = config.requests?.[requestIdArg(data)]
    if (typeof spec === 'object' && 'revert' in spec) throw new RpcError('execution reverted', 3, spec.revert)
    if (!spec || spec === 'not-found') {
      throw new RpcError('execution reverted', 3, oracleRead.encodeErrorResult('RequestNotFound'))
    }
    return encodeRequest(spec)
  },
  [selectorOf(consensusRead, 'getAttestationSignatureId')]: (config, data) => {
    if (config.failAttestationGetters) throw new RpcError('attestation read failed')
    const signatureId = config.signatureIds?.[requestIdArg(data)] ?? ZeroHash
    return consensusRead.encodeFunctionResult('getAttestationSignatureId', [signatureId])
  },
  [selectorOf(consensusRead, 'getTransactionAttestationByHash')]: (config) => {
    if (config.failAttestationGetters || !config.attestation) throw new RpcError('attestation read failed')
    const { r, z } = config.attestation
    return consensusRead.encodeFunctionResult('getTransactionAttestationByHash', [
      [[BigInt(r.x), BigInt(r.y)], BigInt(z)],
    ])
  },
}

const blockTimestamp = (config: RpcConfig, number: number): number => {
  if (config.timestampAt) return config.timestampAt(number)
  const head = config.head ?? 0
  return Math.max(0, (config.headTimestamp ?? 1_000_000) - (head - number) * (config.blockTimeSeconds ?? 5))
}

/** A block header; the head is always served, other numbers may fail per `failBlockProbes`. */
const blockResult = (config: RpcConfig, tag: string, hash: (number: number) => string) => {
  const head = config.head ?? 0
  const number = tag === 'latest' ? head : hexToNum(tag)
  if (number !== head && config.failBlockProbes === 'error') throw new RpcError('missing trie node')
  if (number !== head && config.failBlockProbes === 'null') return null
  return {
    number: '0x' + number.toString(16),
    timestamp: '0x' + blockTimestamp(config, number).toString(16),
    hash: hash(number),
    parentHash: '0x' + '33'.repeat(32),
    nonce: '0x0000000000000000',
    difficulty: '0x0',
    gasLimit: '0x1c9c380',
    gasUsed: '0x0',
    miner: '0x' + '00'.repeat(20),
    extraData: '0x',
    baseFeePerGas: '0x7',
    transactions: [],
  }
}

type JsonRpcRequest = { id: number; method: string; params: unknown[] }

export type RpcEndpoint = {
  handler: HttpHandler
  getLogsCalls: GetLogsFilter[]
  ethCalls: EthCall[]
  /** Every JSON-RPC method seen, in order. */
  methods: string[]
  gate: { logsArrived: Promise<void>; releaseLogs: () => void }
}

/** One JSON-RPC endpoint recorder + responder. Handles single and batched bodies. */
export const makeEndpoint = (config: RpcConfig): RpcEndpoint => {
  const getLogsCalls: GetLogsFilter[] = []
  const ethCalls: EthCall[] = []
  const methods: string[] = []
  let blockProbes = 0
  const hashOf = (number: number): string => config.blockHash?.(number, blockProbes++) ?? '0x' + '22'.repeat(32)

  const handlers: Record<string, (params: unknown[]) => unknown> = {
    eth_chainId: () => '0x' + Number(config.chainId ?? '100').toString(16),
    eth_getBlockByNumber: (params) => blockResult(config, params[0] as string, hashOf),
    eth_getLogs: (params) => {
      const raw = params[0] as { address?: string; topics: unknown[]; fromBlock: string; toBlock: string }
      const filter: GetLogsFilter = {
        address: raw.address,
        topics: raw.topics,
        fromBlock: hexToNum(raw.fromBlock),
        toBlock: hexToNum(raw.toBlock),
      }
      getLogsCalls.push(filter)
      const served = config.ignoreIndexedTopics ? { ...filter, topics: [filter.topics[0]] } : filter
      return filterLogs(config.logs ?? [], served).map(toWireLog)
    },
    eth_call: (params) => {
      const call = params[0] as { to: string; data: string }
      const selector = call.data.slice(0, 10)
      ethCalls.push({ to: call.to, selector, blockTag: params[1] })
      const handle = CALL_HANDLERS[selector]
      if (!handle) throw new RpcError('unexpected eth_call')
      return handle(config, call.data)
    },
  }

  const respondOne = (req: JsonRpcRequest) => {
    methods.push(req.method)
    try {
      if (config.failEverything) throw new RpcError('endpoint down', -32000)
      const handle = handlers[req.method]
      if (!handle) throw new RpcError(`unhandled ${req.method}`)
      return { jsonrpc: '2.0', id: req.id, result: handle(req.params) }
    } catch (error) {
      if (!(error instanceof RpcError)) throw error
      const { code, message, data } = error
      return { jsonrpc: '2.0', id: req.id, error: { code, message, ...(data ? { data } : {}) } }
    }
  }

  // Signals arrival of the first `eth_getLogs` and holds the response until the
  // test releases it, so a concurrent read can fail while this one is in flight.
  const arrival = Promise.withResolvers<void>()
  const release = Promise.withResolvers<void>()

  const handler = http.post(config.url, async ({ request }) => {
    const body = (await request.json()) as JsonRpcRequest | JsonRpcRequest[]
    const calls = Array.isArray(body) ? body : [body]
    const response = Array.isArray(body) ? body.map(respondOne) : respondOne(body)
    if (config.gateLogs && calls.some((call) => call.method === 'eth_getLogs')) {
      arrival.resolve()
      await release.promise
    }
    return HttpResponse.json(response)
  })
  return {
    handler,
    getLogsCalls,
    ethCalls,
    methods,
    gate: { logsArrived: arrival.promise, releaseLogs: release.resolve },
  }
}
