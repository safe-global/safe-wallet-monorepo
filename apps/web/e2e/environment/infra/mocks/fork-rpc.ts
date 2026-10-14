/**
 * The Transaction Service's RPC on a fork: it forwards every call to Anvil, but refuses log scans below the fork
 * block and the trace and filter methods, so indexing never reaches the archive RPC for old history.
 * GET /status reports how many log requests arrived and the lowest block they started at.
 */
import { isMain, json, postJson, requiredEnv, serve } from './http.ts'
import type { Handler, Reply } from './http.ts'

const RPC_TIMEOUT_MS = 60_000
const UNSUPPORTED_METHODS = ['eth_newFilter', 'eth_getFilterLogs', 'eth_getFilterChanges']

type RpcRequest = { id?: unknown; method: string; params?: unknown }
type LogFilter = Record<string, unknown>
export type Forward = (request: RpcRequest) => Promise<unknown>
export type Log = (message: string) => void

class InvalidRequest extends Error {}

function validateLogBound(field: string, value: unknown, forkBlock: number): void {
  if (value === 'latest' || value === 'pending') {
    if (field === 'fromBlock') throw new InvalidRequest('Fork log filters require an explicit numeric fromBlock')
    return
  }
  if (typeof value !== 'string' || !value.startsWith('0x')) {
    throw new InvalidRequest('Fork log filters require explicit block bounds')
  }
  if (!/^0x[0-9a-fA-F]+$/.test(value)) throw new InvalidRequest('Invalid log block number')
  if (parseInt(value, 16) < forkBlock) {
    throw new InvalidRequest(`Historical indexing below fork block ${forkBlock} is forbidden`)
  }
}

function validateLogFilter(params: unknown, forkBlock: number): void {
  if (!Array.isArray(params) || params.length !== 1 || typeof params[0] !== 'object' || params[0] === null) {
    throw new InvalidRequest('Invalid log filter')
  }
  const query = params[0] as LogFilter
  if ('blockHash' in query) throw new InvalidRequest('Fork log filters require an explicit block range')
  for (const field of ['fromBlock', 'toBlock']) validateLogBound(field, query[field], forkBlock)
}

/** Throws InvalidRequest for a call that could make the indexer scan history below the fork block. */
export function validateRequest(request: unknown, forkBlock: number): asserts request is RpcRequest {
  if (typeof request !== 'object' || request === null || typeof (request as RpcRequest).method !== 'string') {
    throw new InvalidRequest('Invalid RPC request')
  }
  const { method, params } = request as RpcRequest
  if (method.startsWith('trace_') || method.startsWith('debug_trace') || UNSUPPORTED_METHODS.includes(method)) {
    throw new InvalidRequest('Fork TXS profile supports eth_getLogs indexing only')
  }
  if (method === 'eth_getLogs') validateLogFilter(params ?? [], forkBlock)
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
    try {
      validateRequest(request, forkBlock)
    } catch (error) {
      if (!(error instanceof InvalidRequest)) throw error
      onReject(error.message)
      return { jsonrpc: '2.0', id: requestId(request), error: { code: -32602, message: error.message } }
    }
    return forward(request)
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
  const forward: Forward = (request) => {
    if (request.method === 'eth_getLogs') {
      const start = parseInt((request.params as LogFilter[])[0].fromBlock as string, 16)
      stats.logRequests += 1
      stats.minimumFromBlock = stats.minimumFromBlock === null ? start : Math.min(stats.minimumFromBlock, start)
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
  serve(8546, forkRpc(Number(requiredEnv('FORK_BLOCK_NUMBER')), requiredEnv('FORK_RPC_TARGET')))
}
