/**
 * Serves recorded Sepolia CoW Protocol orders to the gateway in place of https://api.cow.fi.
 *
 * Scenarios replay the staging transactions from new Safes, so an order is found by its validTo
 * (the last four bytes of its UID) and returned with the staging owner replaced by the requested one.
 * Requests without a recording return 404 when COW_API_OFFLINE is true, as in the stack; otherwise
 * they go to the real API, which helps capture new recordings locally.
 * Scenarios register replayed settlements (`register-settlement <tx hash> <order uid>...`), because
 * the gateway looks up the orders of a settlement by its local transaction hash.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { request as httpsRequest } from 'node:https'
import { isMain, json, readText, serveTls } from './http.ts'
import type { MockRequest, Reply } from './http.ts'

const ORDERS_FILE = new URL('./cow-api-orders.json', import.meta.url)
const UPSTREAM = 'api.cow.fi'
const PORT = 443
export const PREFIX = '/sepolia/api/v1'
const SETTLEMENTS_DIR = '/tmp/settlements'
const UID = /^0x[0-9a-f]{112}$/
const TX_HASH = /^0x[0-9a-f]{64}$/
const UPSTREAM_TIMEOUT_MS = 30_000

type Order = { uid: string; owner: string } & Record<string, unknown>
export type Fixtures = { orders: Map<string, Order>; appData: Record<string, unknown> }
export type Upstream = (path: string) => Promise<Reply>

export function loadFixtures(file: URL = ORDERS_FILE): Fixtures {
  const data = JSON.parse(readFileSync(file, 'utf8')) as { orders: Order[]; appData: Record<string, unknown> }
  const orders = new Map(data.orders.map((order) => [order.uid.slice(-8), order]))
  if (orders.size !== data.orders.length) throw new Error('Recorded orders must have unique validTo values')
  return { orders, appData: data.appData }
}

function orderFor(fixtures: Fixtures, uid: string): Order | undefined {
  const recorded = fixtures.orders.get(uid.slice(-8))
  if (recorded === undefined) return undefined
  const owner = `0x${uid.slice(66, 106)}`
  const order = JSON.parse(JSON.stringify(recorded).replaceAll(recorded.owner, owner)) as Order
  return { ...order, uid }
}

/** Stores the orders of a replayed settlement in `directory`; throws for a malformed hash or UID. */
export function registerSettlement(txHash: string, uids: string[], directory = SETTLEMENTS_DIR): void {
  const hash = txHash.toLowerCase()
  const orders = uids.map((uid) => uid.toLowerCase())
  if (!TX_HASH.test(hash) || orders.length === 0 || !orders.every((uid) => UID.test(uid))) {
    throw new Error('Usage: register-settlement <transaction hash> <order uid>...')
  }
  mkdirSync(directory, { recursive: true })
  writeFileSync(`${directory}/${hash}.json`, JSON.stringify(orders))
}

function settlementOrders(fixtures: Fixtures, settlementsDir: string, txHash: string): Reply | undefined {
  const file = `${settlementsDir}/${txHash}.json`
  if (!TX_HASH.test(txHash) || !existsSync(file)) return undefined
  const uids = JSON.parse(readFileSync(file, 'utf8')) as string[]
  const orders = uids.map((uid) => orderFor(fixtures, uid))
  if (orders.includes(undefined)) throw new Error(`Settlement ${txHash} references an unrecorded order`)
  return json(200, orders)
}

/** Returns the recorded response, or undefined when the request has no recording. */
export function recordedReply(fixtures: Fixtures, settlementsDir: string, path: string): Reply | undefined {
  if (path === '/health') return json(200, { ready: true })
  if (!path.startsWith(`${PREFIX}/`)) return undefined
  const rest = path.slice(PREFIX.length + 1).toLowerCase()
  const separator = rest.indexOf('/')
  const [resource, value] = separator === -1 ? [rest, ''] : [rest.slice(0, separator), rest.slice(separator + 1)]
  if (resource === 'orders' && UID.test(value)) {
    const order = orderFor(fixtures, value)
    return order && json(200, order)
  }
  if (resource === 'app_data' && value in fixtures.appData) return json(200, fixtures.appData[value])
  if (resource === 'transactions' && value.endsWith('/orders')) {
    return settlementOrders(fixtures, settlementsDir, value.slice(0, -'/orders'.length))
  }
  return undefined
}

async function upstreamAddress(): Promise<string> {
  // Inside the stack api.cow.fi resolves to this mock, so the real address comes from public DNS.
  const response = await fetch(`https://1.1.1.1/dns-query?name=${UPSTREAM}&type=A`, {
    headers: { Accept: 'application/dns-json' },
    signal: AbortSignal.timeout(10_000),
  })
  const { Answer = [] } = (await response.json()) as { Answer?: { type: number; data: string }[] }
  const address = Answer.find((answer) => answer.type === 1)?.data
  if (!address) throw new Error(`Public DNS has no A record for ${UPSTREAM}`)
  return address
}

function getUpstream(host: string, path: string): Promise<Reply> {
  return new Promise((resolve, reject) => {
    const options = { host, servername: UPSTREAM, path, headers: { Host: UPSTREAM, Accept: 'application/json' } }
    const request = httpsRequest(options, (response) => {
      const headers = { 'Content-Type': 'application/json' }
      readText(response).then((body) => resolve({ status: response.statusCode ?? 502, headers, body }), reject)
    })
    request.setTimeout(UPSTREAM_TIMEOUT_MS, () => request.destroy(new Error('Upstream timeout')))
    request.on('error', reject)
    request.end()
  })
}

const realApi: Upstream = async (path) => {
  try {
    return await getUpstream(await upstreamAddress(), path)
  } catch (error) {
    return json(502, { errorType: 'UpstreamUnavailable', description: `${UPSTREAM}${path}: ${error}` })
  }
}

type CowOptions = { fixtures: Fixtures; settlementsDir: string; offline: boolean; upstream?: Upstream }

export async function dispatch(
  { path, query }: Pick<MockRequest, 'path' | 'query'>,
  { fixtures, settlementsDir, offline, upstream = realApi }: CowOptions,
): Promise<Reply> {
  const recorded = recordedReply(fixtures, settlementsDir, path)
  if (recorded) return recorded
  const fullPath = query.size ? `${path}?${query}` : path
  if (offline) return json(404, { errorType: 'NotFound', description: `No recorded response for ${fullPath}` })
  return upstream(fullPath)
}

if (isMain(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2)
  if (command === 'register-settlement') {
    const [txHash, ...uids] = args
    registerSettlement(txHash, uids)
  } else {
    const options = {
      fixtures: loadFixtures(),
      settlementsDir: SETTLEMENTS_DIR,
      offline: process.env.COW_API_OFFLINE === 'true',
    }
    serveTls(PORT, (request) => dispatch(request, options))
  }
}
