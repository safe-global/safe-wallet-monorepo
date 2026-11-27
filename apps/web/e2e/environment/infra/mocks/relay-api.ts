/**
 * Relays sponsored Safe transactions to the local forks in place of the hosted relay provider.
 *
 * The gateway (RELAY_PROVIDER_API_BASE_URI) validates the call and keeps the daily limit itself, as with
 * the real provider. This mock only submits the call from an impersonated relayer account and reports the
 * task status; the transaction hash is the task ID.
 */
import { UpstreamUnreachable, isMain, json, postJson, requiredEnv, serve } from './http.ts'
import type { MockRequest, Reply } from './http.ts'

// The relay task states the gateway passes on to the wallet.
export const SUBMITTED = 110
export const INCLUDED = 200
export const REVERTED = 500

export const RELAYER = '0x5afe00000000000000000000000000000000beef'
const RELAYER_BALANCE = `0x${(10n ** 21n).toString(16)}`
const TASK_STATUS = /^\/safe-transactions\/(0x[0-9a-fA-F]{64})\/status$/
const RPC_TIMEOUT_MS = 60_000
const PORT = 8092

export class RpcError extends Error {}

export type Rpc = (url: string, method: string, params: unknown[]) => Promise<unknown>

type RpcAnswer = { result?: unknown; error?: { message?: string } }
type Receipt = { status: string }

/** Parses "chainId=url,chainId=url" into a chain ID to RPC URL map. */
export function parseRpcUrls(value: string): Map<string, string> {
  const entries = value
    .split(',')
    .filter(Boolean)
    .map((entry): [string, string] => {
      const separator = entry.indexOf('=')
      return [entry.slice(0, separator), entry.slice(separator + 1)]
    })
  if (entries.length === 0) throw new Error('RELAY_RPC_URLS must list at least one chainId=url')
  return new Map(entries)
}

export const jsonRpc: Rpc = async (url, method, params) => {
  const answer = (await postJson(url, { jsonrpc: '2.0', id: 1, method, params }, RPC_TIMEOUT_MS)) as RpcAnswer
  if (answer.error) throw new RpcError(`${method} failed: ${answer.error.message}`)
  return answer.result
}

function rejection(status: number, message: string): Reply {
  return json(status, { errors: [{ message }] })
}

type RelayBody = { chainId?: unknown; to?: string; data?: string }

async function relay(body: RelayBody, rpcUrls: Map<string, string>, rpc: Rpc): Promise<Reply> {
  const url = rpcUrls.get(String(body.chainId))
  if (url === undefined) return rejection(400, `No local fork for chain ${body.chainId}`)
  if (!body.to || !body.data) return rejection(400, 'Relay requests need to and data')
  await rpc(url, 'anvil_setBalance', [RELAYER, RELAYER_BALANCE])
  await rpc(url, 'anvil_impersonateAccount', [RELAYER])
  try {
    const taskId = await rpc(url, 'eth_sendTransaction', [{ from: RELAYER, to: body.to, data: body.data }])
    return json(200, { taskId })
  } catch (error) {
    if (error instanceof RpcError) return rejection(400, error.message)
    throw error
  }
}

async function knowsTransaction(url: string, taskId: string, rpc: Rpc): Promise<boolean> {
  try {
    return (await rpc(url, 'eth_getTransactionByHash', [taskId])) !== null
  } catch (error) {
    // An unreachable fork cannot hold the task; any other failure is real.
    if (error instanceof UpstreamUnreachable) return false
    throw error
  }
}

async function taskStatus(taskId: string, rpcUrls: Map<string, string>, rpc: Rpc): Promise<Reply> {
  // Task IDs are transaction hashes, so the fork that knows the transaction holds the task.
  for (const url of rpcUrls.values()) {
    if (!(await knowsTransaction(url, taskId, rpc))) continue
    const receipt = (await rpc(url, 'eth_getTransactionReceipt', [taskId])) as Receipt | null
    if (receipt === null) return json(200, { taskId, status: SUBMITTED })
    const status = parseInt(receipt.status, 16) === 1 ? INCLUDED : REVERTED
    return json(200, { taskId, status, transactionHash: taskId })
  }
  return rejection(404, `Unknown relay task ${taskId}`)
}

export async function dispatch(
  { method, path, body }: Pick<MockRequest, 'method' | 'path' | 'body'>,
  rpcUrls: Map<string, string>,
  rpc: Rpc = jsonRpc,
): Promise<Reply> {
  if (method === 'GET' && path === '/health') return json(200, { ready: true })
  if (method === 'POST' && path === '/safe-transactions') {
    return relay(body ? (JSON.parse(body) as RelayBody) : {}, rpcUrls, rpc)
  }
  const match = TASK_STATUS.exec(path)
  if (method === 'GET' && match) return taskStatus(match[1], rpcUrls, rpc)
  return rejection(404, `No route for ${method} ${path}`)
}

if (isMain(import.meta.url)) {
  const rpcUrls = parseRpcUrls(requiredEnv('RELAY_RPC_URLS'))
  serve(PORT, async (request) => {
    try {
      return await dispatch(request, rpcUrls)
    } catch (error) {
      return rejection(502, `Local fork unavailable: ${error instanceof Error ? error.message : error}`)
    }
  })
}
