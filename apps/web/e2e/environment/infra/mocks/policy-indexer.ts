/**
 * Answers the gateway's policy indexer query (POLICY_INDEXER_BASE_URI) with the guard policies that scenarios
 * registered per Safe, and with no allowances or delegates.
 *
 * The gateway reads spending limits, guard policy bindings and configuration roots from the indexer, and proposers
 * from the delegates, in one request. Without an indexer, that request fails, and with it every policy of a
 * Workspace. Spending limits stay empty; the proposer policies come through.
 *
 * Register a Safe's state with `node policy-indexer.ts register <chainId> <address>` and the state as JSON on stdin:
 * `{ "GuardPolicyBinding": [Binding, …], "ConfigurationRoot": [Root, …] }`. It replaces what the Safe had.
 */
import { isMain, json, localRequest, readText, serve } from './http.ts'
import type { MockRequest, Reply } from './http.ts'

const PORT = 8094
const REGISTER_PATH = /^\/__test\/chains\/(\d+)\/safes\/(0x[0-9a-fA-F]{40})\/guard-policies$/
const ROOT_STATUSES = ['PENDING', 'APPLIED', 'INVALIDATED']

/** One `SafePolicy` row of the indexer, which the query aliases to `GuardPolicyBinding`. */
export type Binding = {
  chainId: number
  safe: string
  guard: string
  target: string
  selector: string
  operation: 'CALL' | 'DELEGATECALL'
  kind: string
  policy: string
  state: unknown
}

/** A delayed configuration root; `readyAt` and `expiresAt` are unix seconds as decimal strings, as `numeric` is. */
export type Root = {
  chainId: number
  safe: string
  guard: string
  root: string
  readyAt: string
  expiresAt: string
  status: 'PENDING' | 'APPLIED' | 'INVALIDATED'
}

export type SafeState = { GuardPolicyBinding: Binding[]; ConfigurationRoot: Root[] }
export type Registry = Map<string, SafeState>

type SafeFilter = { chainId?: { _eq?: unknown }; safe?: { _in?: unknown } }
type Variables = { guardPolicyBindings?: unknown; guardPolicyKinds?: unknown; roots?: unknown }

class InvalidState extends Error {}

const safeKey = (chainId: number, safe: string): string => `${chainId}:${safe.toLowerCase()}`

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

function rowsOf(value: unknown, field: string, chainId: number, safe: string): Record<string, unknown>[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || !value.every(isRecord)) throw new InvalidState(`${field} must be a list of rows`)
  for (const row of value) {
    if (row.chainId !== chainId || typeof row.safe !== 'string' || row.safe.toLowerCase() !== safe.toLowerCase()) {
      throw new InvalidState(`Every ${field} row must name chain ${chainId} and Safe ${safe}`)
    }
  }
  return value
}

export function parseState(body: string, chainId: number, safe: string): SafeState {
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    throw new InvalidState('The state is not JSON')
  }
  if (!isRecord(parsed)) throw new InvalidState('The state must be an object')
  const roots = rowsOf(parsed.ConfigurationRoot, 'ConfigurationRoot', chainId, safe)
  for (const root of roots) {
    if (!ROOT_STATUSES.includes(String(root.status))) throw new InvalidState(`Unknown root status ${root.status}`)
    const isUnixSeconds = (value: unknown) => typeof value === 'string' && /^\d+$/.test(value)
    if (!isUnixSeconds(root.readyAt) || !isUnixSeconds(root.expiresAt)) {
      throw new InvalidState('readyAt and expiresAt must be decimal strings of unix seconds')
    }
  }
  return {
    GuardPolicyBinding: rowsOf(parsed.GuardPolicyBinding, 'GuardPolicyBinding', chainId, safe) as Binding[],
    ConfigurationRoot: roots as Root[],
  }
}

/** The Safes that the query's `{ chainId: { _eq }, safe: { _in } }` groups name, as registry keys. */
function requestedSafes(groups: unknown): Set<string> {
  const keys = new Set<string>()
  if (!Array.isArray(groups)) return keys
  for (const group of groups as SafeFilter[]) {
    const chainId = group?.chainId?._eq
    const safes = group?.safe?._in
    if (typeof chainId !== 'number' || !Array.isArray(safes)) continue
    for (const safe of safes) if (typeof safe === 'string') keys.add(safeKey(chainId, safe))
  }
  return keys
}

function variablesOf(body: string): Variables {
  try {
    const parsed: unknown = JSON.parse(body)
    return isRecord(parsed) && isRecord(parsed.variables) ? parsed.variables : {}
  } catch {
    return {}
  }
}

export function queryState(registry: Registry, body: string): Reply {
  const variables = variablesOf(body)
  const kinds = Array.isArray(variables.guardPolicyKinds) ? variables.guardPolicyKinds : []
  const bindingSafes = requestedSafes(variables.guardPolicyBindings)
  const rootSafes = requestedSafes(variables.roots)
  const bindings = [...bindingSafes].flatMap((key) => registry.get(key)?.GuardPolicyBinding ?? [])
  const roots = [...rootSafes].flatMap((key) => registry.get(key)?.ConfigurationRoot ?? [])
  return json(200, {
    data: {
      _meta: [],
      SafeAllowance: [],
      SafeDelegate: [],
      GuardPolicyBinding: bindings.filter((binding) => kinds.includes(binding.kind)),
      ConfigurationRoot: roots,
    },
  })
}

function register(registry: Registry, chainId: number, safe: string, body: string): Reply {
  try {
    registry.set(safeKey(chainId, safe), parseState(body, chainId, safe))
    return json(200, { chainId, safe })
  } catch (error) {
    if (error instanceof InvalidState) return json(400, { message: error.message })
    throw error
  }
}

export function dispatch(
  { method, path, body }: Pick<MockRequest, 'method' | 'path' | 'body'>,
  registry: Registry,
): Reply {
  if (path === '/health') return json(200, { ready: true })
  const registration = REGISTER_PATH.exec(path)
  if (method === 'POST' && registration) return register(registry, Number(registration[1]), registration[2], body)
  if (method === 'POST' && path === '/v1/graphql') return queryState(registry, body)
  return json(404, { errors: [{ message: 'No policy indexer fixture' }] })
}

async function registerWithServer(chainId: string, safe: string): Promise<void> {
  const body = await readText(process.stdin)
  const reply = await localRequest(PORT, `/__test/chains/${chainId}/safes/${safe}/guard-policies`, {
    method: 'POST',
    body,
  })
  if (reply.status !== 200) throw new Error(`The policy indexer mock refused the state: ${reply.body}`)
}

if (isMain(import.meta.url)) {
  const [command, chainId, safe] = process.argv.slice(2)
  if (command === 'register') {
    await registerWithServer(chainId, safe)
  } else {
    const registry: Registry = new Map()
    serve(PORT, (request) => dispatch(request, registry))
  }
}
