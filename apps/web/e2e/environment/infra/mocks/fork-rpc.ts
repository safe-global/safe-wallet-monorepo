/**
 * The Transaction Service's RPC on a fork: it forwards every call to Anvil, but refuses log scans below the fork
 * block and the trace and filter methods, so indexing never reaches the archive RPC for old history.
 * GET /status reports how many log requests arrived and the lowest block they started at.
 */
import { isMain, json, postJson, requiredEnv, serve } from './http.ts'
import type { Handler, Reply } from './http.ts'

const RPC_TIMEOUT_MS = 60_000
const PORT = 8546
const UNSUPPORTED_METHODS = ['eth_newFilter', 'eth_getFilterLogs', 'eth_getFilterChanges']

type RpcRequest = { id?: unknown; method: string; params?: unknown }
type LogFilter = Record<string, unknown>
/** `fromBlock` is the checked start of an eth_getLogs call, and undefined for any other call. */
export type Forward = (request: RpcRequest, fromBlock: number | undefined) => Promise<unknown>
export type Log = (message: string) => void

class InvalidRequest extends Error {}

/** Returns the block number of a numeric bound, or undefined for latest and pending. */
function validateLogBound(field: string, value: unknown, forkBlock: number): number | undefined {
  if (value === 'latest' || value === 'pending') {
    if (field === 'fromBlock') throw new InvalidRequest('Fork log filters require an explicit numeric fromBlock')
    return undefined
  }
  if (typeof value !== 'string' || !value.startsWith('0x')) {
    throw new InvalidRequest('Fork log filters require explicit block bounds')
  }
  if (!/^0x[0-9a-fA-F]+$/.test(value)) throw new InvalidRequest('Invalid log block number')
  const block = parseInt(value, 16)
  if (block < forkBlock) throw new InvalidRequest(`Historical indexing below fork block ${forkBlock} is forbidden`)
  return block
}

/** Returns the fromBlock of a valid log filter. */
function validateLogFilter(params: unknown, forkBlock: number): number | undefined {
  if (!Array.isArray(params) || params.length !== 1 || typeof params[0] !== 'object' || params[0] === null) {
    throw new InvalidRequest('Invalid log filter')
  }
  const query = params[0] as LogFilter
  if ('blockHash' in query) throw new InvalidRequest('Fork log filters require an explicit block range')
  const fromBlock = validateLogBound('fromBlock', query.fromBlock, forkBlock)
  validateLogBound('toBlock', query.toBlock, forkBlock)
  return fromBlock
}

type CheckedRequest = { request: RpcRequest; fromBlock: number | undefined }

/** Throws InvalidRequest for a call that could make the indexer scan history below the fork block. */
export function validateRequest(request: unknown, forkBlock: number): CheckedRequest {
  if (typeof request !== 'object' || request === null || typeof (request as RpcRequest).method !== 'string') {
    throw new InvalidRequest('Invalid RPC request')
  }
  const rpcRequest = request as RpcRequest
  const { method, params } = rpcRequest
  if (method.startsWith('trace_') || method.startsWith('debug_trace') || UNSUPPORTED_METHODS.includes(method)) {
    throw new InvalidRequest('Fork TXS profile supports eth_getLogs indexing only')
  }
  const fromBlock = method === 'eth_getLogs' ? validateLogFilter(params ?? [], forkBlock) : undefined
  return { request: rpcRequest, fromBlock }
}

function requestId(request: unknown): unknown {
  return typeof request === 'object' && request !== null ? ((request as RpcRequest).id ?? null) : null
}

/** Forwards each valid call; a refused call gets a JSON-RPC error and never reaches Anvil. */
export async function dispatch(
  payload: unknown,
  forkBlock: number,
  forward: Forward,
  onReject: Log = () => {},
): Promise<unknown> {
  const execute = async (request: unknown): Promise<unknown> => {
    let checked: CheckedRequest
    try {
      checked = validateRequest(request, forkBlock)
    } catch (error) {
      if (!(error instanceof InvalidRequest)) throw error
      onReject(error.message)
      return { jsonrpc: '2.0', id: requestId(request), error: { code: -32602, message: error.message } }
    }
    return forward(checked.request, checked.fromBlock)
  }
  if (!Array.isArray(payload)) return execute(payload)
  const results = []
  for (const request of payload) results.push(await execute(request))
  return results
}

type Stats = { forkBlock: number; logRequests: number; minimumFromBlock: number | null; rejectedRequests: number }

function parsePayload(body: string): unknown {
  if (!body) throw new SyntaxError('empty request')
  return JSON.parse(body)
}

/** The HTTP handler; `log` receives failures without the RPC URL. */
export function forkRpc(forkBlock: number, rpcUrl: string, log: Log = console.error): Handler {
  if (!(forkBlock > 0)) throw new Error('FORK_BLOCK_NUMBER must be positive')
  const stats: Stats = { forkBlock, logRequests: 0, minimumFromBlock: null, rejectedRequests: 0 }
  const forward: Forward = (request, fromBlock) => {
    if (fromBlock !== undefined) {
      stats.logRequests += 1
      stats.minimumFromBlock = Math.min(stats.minimumFromBlock ?? fromBlock, fromBlock)
    }
    return postJson(rpcUrl, request, RPC_TIMEOUT_MS)
  }
  const onReject: Log = (message) => {
    stats.rejectedRequests += 1
    log(`Rejected indexing RPC: ${message}`)
  }
  return async ({ method, path, body }): Promise<Reply> => {
    if (method === 'GET') {
      if (path === '/status') return json(200, stats)
      return path === '/health' ? json(200, { ready: true }) : json(404, {})
    }
    let payload: unknown
    try {
      payload = parsePayload(body)
    } catch (error) {
      return json(400, { message: `Invalid JSON-RPC request: ${(error as Error).message}` })
    }
    try {
      return json(200, await dispatch(payload, forkBlock, forward, onReject))
    } catch (error) {
      log(`Fork RPC upstream request failed: ${(error as Error).name}`)
      return json(502, { message: 'Fork RPC request failed' })
    }
  }
}

if (isMain(import.meta.url)) {
  serve(PORT, forkRpc(Number(requiredEnv('FORK_BLOCK_NUMBER')), requiredEnv('FORK_RPC_TARGET')))
}
