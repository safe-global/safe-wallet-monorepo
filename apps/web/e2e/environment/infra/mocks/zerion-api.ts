/**
 * Answers the gateway's Zerion calls (ZERION_BASE_URI) with positions that a scenario registered for a wallet.
 *
 * The gateway reads the chain list, a wallet's positions (the portfolio and the positions widget) and a wallet's
 * totals (the Safe overviews) from Zerion. A wallet without registered positions gets a 503, so the gateway and the
 * wallet use their Transaction Service fallback, as they do when Zerion is down.
 *
 * Register with `node zerion-api.ts register <address>` and the rows as JSON on stdin: `{ "rows": [Row, …] }`.
 */
import { isMain, json, localRequest, readText, serve } from './http.ts'
import type { MockRequest, Reply } from './http.ts'

const PORT = 8095
const REGISTER_PATH = /^\/__test\/wallets\/(0x[0-9a-fA-F]{40})\/positions$/
const POSITIONS_PATH = /^\/v1\/wallets\/(0x[0-9a-fA-F]{40})\/positions\/?$/
const PORTFOLIO_PATH = /^\/v1\/wallets\/(0x[0-9a-fA-F]{40})\/portfolio\/?$/

/** Zerion's network names of the forks; the gateway maps them back to chain IDs through /v1/chains */
const NETWORKS: Record<string, { network: string; testnet: boolean }> = {
  '1': { network: 'ethereum', testnet: false },
  '137': { network: 'polygon', testnet: false },
  '11155111': { network: 'sepolia', testnet: true },
}

const POSITION_TYPES = ['wallet', 'deposit', 'loan', 'locked', 'staked', 'reward', 'airdrop', 'margin']

/** A position in the short form that scenarios register; `quantity` is a decimal string such as "1.5". */
export type Row = {
  chainId: string
  type: string
  token: { address: string | null; symbol: string; name: string; decimals: number }
  quantity: string
  value: number | null
  price: number | null
  trash?: boolean
  app?: { name: string; url: string }
  groupId?: string
}

export type Registry = Map<string, Row[]>

class InvalidRows extends Error {}

function isRow(value: unknown): value is Row {
  if (typeof value !== 'object' || value === null) return false
  const row = value as Partial<Row>
  const token = row.token
  return (
    typeof row.chainId === 'string' &&
    row.chainId in NETWORKS &&
    typeof row.type === 'string' &&
    POSITION_TYPES.includes(row.type) &&
    typeof token === 'object' &&
    token !== null &&
    (token.address === null || typeof token.address === 'string') &&
    typeof token.symbol === 'string' &&
    typeof token.name === 'string' &&
    Number.isInteger(token.decimals) &&
    typeof row.quantity === 'string' &&
    /^\d+(\.\d+)?$/.test(row.quantity)
  )
}

function parseRows(body: string): Row[] {
  let data: unknown
  try {
    data = JSON.parse(body)
  } catch {
    throw new InvalidRows('The body is not JSON')
  }
  const rows = typeof data === 'object' && data !== null && 'rows' in data ? data.rows : undefined
  if (!Array.isArray(rows) || !rows.every(isRow)) {
    throw new InvalidRows(
      `Send { rows: Row[] }; each row needs chainId (${Object.keys(NETWORKS)}), a position type, a token and a decimal quantity`,
    )
  }
  return rows
}

/** The base-unit integer of a decimal quantity, such as "1.5" with 6 decimals → "1500000". */
function baseUnits(quantity: string, decimals: number): string {
  const [whole, fraction = ''] = quantity.split('.')
  const digits = `${whole}${fraction.padEnd(decimals, '0').slice(0, decimals)}`
  return BigInt(digits).toString()
}

/** The full Zerion position; the chain relationship and the implementation share the network name, as the gateway requires. */
export function zerionPosition(row: Row, index: number): unknown {
  const { network } = NETWORKS[row.chainId]
  const { token } = row
  return {
    type: 'positions',
    id: `${network}-${token.address ?? 'base'}-${row.type}-${index}`,
    attributes: {
      protocol: row.app?.name ?? null,
      name: token.name,
      position_type: row.type,
      application_metadata: row.app ? { name: row.app.name, icon: { url: null }, url: row.app.url } : null,
      quantity: {
        int: baseUnits(row.quantity, token.decimals),
        decimals: token.decimals,
        float: Number(row.quantity),
        numeric: row.quantity,
      },
      value: row.value,
      price: row.price,
      fungible_info: {
        name: token.name,
        symbol: token.symbol,
        description: null,
        icon: null,
        flags: { verified: !row.trash },
        implementations: [{ chain_id: network, address: token.address, decimals: token.decimals }],
      },
      flags: { displayable: true, is_trash: row.trash === true },
      changes: null,
      pool_address: null,
      group_id: row.groupId ?? null,
    },
    relationships: { chain: { data: { type: 'chains', id: network } } },
  }
}

function chains(testnet: boolean): Reply {
  const data = Object.entries(NETWORKS)
    .filter(([, chain]) => chain.testnet === testnet)
    .map(([chainId, { network }]) => ({
      type: 'chains',
      id: network,
      attributes: {
        external_id: `0x${Number(chainId).toString(16)}`,
        name: network,
        icon: null,
        flags: { supports_positions: true },
      },
    }))
  return json(200, { data })
}

/** The rows that a Zerion query with these filters returns, in Zerion's network and testnet scope. */
function matchingRows(rows: Row[], query: URLSearchParams, testnet: boolean): Row[] {
  const network = query.get('filter[chain_ids]')
  return rows.filter(
    (row) =>
      NETWORKS[row.chainId].testnet === testnet &&
      (!network || NETWORKS[row.chainId].network === network) &&
      (query.get('filter[trash]') !== 'only_non_trash' || !row.trash) &&
      (query.get('filter[positions]') !== 'only_complex' || row.type !== 'wallet'),
  )
}

function portfolio(address: string, rows: Row[]): Reply {
  const distribution: Record<string, number> = {}
  for (const row of rows) {
    const { network } = NETWORKS[row.chainId]
    distribution[network] = (distribution[network] ?? 0) + (row.value ?? 0)
  }
  const total = Object.values(distribution).reduce((sum, value) => sum + value, 0)
  return json(200, {
    data: {
      type: 'portfolio',
      id: address,
      attributes: { total: { positions: total }, positions_distribution_by_chain: distribution },
    },
  })
}

function register(registry: Registry, address: string, body: string): Reply {
  try {
    const rows = parseRows(body)
    registry.set(address.toLowerCase(), rows)
    return json(200, { address, rows: rows.length })
  } catch (error) {
    if (error instanceof InvalidRows) return json(400, { message: error.message })
    throw error
  }
}

function unknownWallet(address: string): Reply {
  return json(503, { errors: [{ title: 'No fake Zerion positions', detail: `Nothing registered for ${address}` }] })
}

export function dispatch(
  { method, path, query, headers, body }: Pick<MockRequest, 'method' | 'path' | 'query' | 'headers' | 'body'>,
  registry: Registry,
): Reply {
  if (path === '/health') return json(200, { ready: true })
  const registration = REGISTER_PATH.exec(path)
  if (method === 'POST' && registration) return register(registry, registration[1], body)
  if (method !== 'GET') return json(404, { errors: [{ title: 'No fake Zerion route' }] })

  const testnet = headers['x-env'] === 'testnet'
  if (path === '/v1/chains' || path === '/v1/chains/') return chains(testnet)

  const wallet = POSITIONS_PATH.exec(path) ?? PORTFOLIO_PATH.exec(path)
  if (!wallet) return json(404, { errors: [{ title: 'No fake Zerion route' }] })
  const rows = registry.get(wallet[1].toLowerCase())
  if (!rows) return unknownWallet(wallet[1])
  const matching = matchingRows(rows, query, testnet)
  if (PORTFOLIO_PATH.test(path)) return portfolio(wallet[1], matching)
  return json(200, { data: matching.map(zerionPosition) })
}

async function registerWithServer(address: string): Promise<void> {
  const body = await readText(process.stdin)
  const reply = await localRequest(PORT, `/__test/wallets/${address}/positions`, { method: 'POST', body })
  if (reply.status !== 200) throw new Error(`The Zerion mock refused the positions: ${reply.body}`)
}

if (isMain(import.meta.url)) {
  const [command, address] = process.argv.slice(2)
  if (command === 'register') {
    await registerWithServer(address)
  } else {
    const registry: Registry = new Map()
    serve(PORT, (request) => dispatch(request, registry))
  }
}
