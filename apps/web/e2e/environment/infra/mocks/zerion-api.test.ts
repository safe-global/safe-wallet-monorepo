import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { dispatch } from './zerion-api.ts'
import type { Registry, Row } from './zerion-api.ts'

const SAFE = '0x1111111111111111111111111111111111111111'
const USDC = { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 }
const ETHER = { address: null, symbol: 'ETH', name: 'Ether', decimals: 18 }

const ROWS: Row[] = [
  { chainId: '1', type: 'wallet', token: ETHER, quantity: '0.5', value: 1000, price: 2000 },
  { chainId: '1', type: 'wallet', token: USDC, quantity: '250.25', value: 250.25, price: 1 },
  {
    chainId: '1',
    type: 'wallet',
    token: { address: '0x2222222222222222222222222222222222222222', symbol: 'SCAM', name: 'Scam', decimals: 18 },
    quantity: '1000',
    value: 0,
    price: 0,
    trash: true,
  },
  {
    chainId: '1',
    type: 'deposit',
    token: USDC,
    quantity: '100',
    value: 100,
    price: 1,
    app: { name: 'Aave', url: 'https://app.aave.com' },
  },
  {
    chainId: '137',
    type: 'wallet',
    token: { ...ETHER, symbol: 'POL', name: 'Polygon' },
    quantity: '2',
    value: 1,
    price: 0.5,
  },
]

type Call = { method?: string; path: string; query?: string; headers?: Record<string, string>; body?: string }
type Position = {
  attributes: {
    position_type: string
    quantity: unknown
    application_metadata: unknown
    fungible_info: { symbol: string; implementations: unknown[] }
  }
  relationships: { chain: { data: { id: string } } }
}
type Positions = { data: Position[] }
type Chains = { data: { id: string; attributes: { external_id: string } }[] }
type Totals = { data: { attributes: unknown } }

function call<Body = unknown>(
  registry: Registry,
  { method = 'GET', path, query = '', headers = {}, body = '' }: Call,
): [number, Body] {
  const reply = dispatch({ method, path, query: new URLSearchParams(query), headers, body }, registry)
  const parsed: Body = JSON.parse(reply.body)
  return [reply.status, parsed]
}

function registered(rows: Row[] = ROWS): Registry {
  const registry: Registry = new Map()
  const [status] = call(registry, {
    method: 'POST',
    path: `/__test/wallets/${SAFE}/positions`,
    body: JSON.stringify({ rows }),
  })
  assert.equal(status, 200)
  return registry
}

function symbols(data: Position[]): string[] {
  return data.map((position) => position.attributes.fungible_info.symbol)
}

describe('Zerion API mock', () => {
  it('lists the mainnet networks, and Sepolia for testnet requests', () => {
    const [, mainnet] = call<Chains>(new Map(), { path: '/v1/chains' })
    assert.deepEqual(
      mainnet.data.map(({ id, attributes }) => [id, attributes.external_id]),
      [
        ['ethereum', '0x1'],
        ['polygon', '0x89'],
      ],
    )
    const [, testnet] = call<Chains>(new Map(), { path: '/v1/chains', headers: { 'x-env': 'testnet' } })
    assert.deepEqual(
      testnet.data.map(({ id }) => id),
      ['sepolia'],
    )
  })

  it('gives a position the chain relationship and the implementation of its network, which the gateway requires', () => {
    const [, body] = call<Positions>(registered(), { path: `/v1/wallets/${SAFE}/positions` })
    const usdc = body.data[1]
    assert.equal(usdc.relationships.chain.data.id, 'ethereum')
    assert.deepEqual(usdc.attributes.fungible_info.implementations, [
      { chain_id: 'ethereum', address: USDC.address, decimals: 6 },
    ])
    assert.deepEqual(usdc.attributes.quantity, { int: '250250000', decimals: 6, float: 250.25, numeric: '250.25' })
  })

  it('leaves out the trash for the trusted portfolio and keeps it otherwise', () => {
    const registry = registered()
    const [, all] = call<Positions>(registry, {
      path: `/v1/wallets/${SAFE}/positions`,
      query: 'filter[positions]=no_filter',
    })
    assert.deepEqual(symbols(all.data), ['ETH', 'USDC', 'SCAM', 'USDC', 'POL'])
    const [, trusted] = call<Positions>(registry, {
      path: `/v1/wallets/${SAFE}/positions`,
      query: 'filter[positions]=no_filter&filter[trash]=only_non_trash',
    })
    assert.deepEqual(symbols(trusted.data), ['ETH', 'USDC', 'USDC', 'POL'])
  })

  it('answers the positions widget with the app positions of one network', () => {
    const [, body] = call<Positions>(registered(), {
      path: `/v1/wallets/${SAFE}/positions`,
      query: 'filter[chain_ids]=ethereum&filter[positions]=only_complex',
    })
    assert.equal(body.data.length, 1)
    assert.equal(body.data[0].attributes.position_type, 'deposit')
    assert.deepEqual(body.data[0].attributes.application_metadata, {
      name: 'Aave',
      icon: { url: null },
      url: 'https://app.aave.com',
    })
  })

  it('sums the values per network for the wallet totals', () => {
    const [status, body] = call<Totals>(registered(), {
      path: `/v1/wallets/${SAFE}/portfolio`,
      query: 'filter[positions]=no_filter&filter[trash]=only_non_trash',
    })
    assert.equal(status, 200)
    assert.deepEqual(body.data.attributes, {
      total: { positions: 1351.25 },
      positions_distribution_by_chain: { ethereum: 1350.25, polygon: 1 },
    })
  })

  it('matches a registered wallet whatever the case of its address', () => {
    const [status] = call(registered(), { path: `/v1/wallets/${SAFE.toUpperCase().replace('0X', '0x')}/positions` })
    assert.equal(status, 200)
  })

  it('fails for a wallet with no registered positions, so the gateway falls back to the Transaction Service', () => {
    for (const path of [`/v1/wallets/${SAFE}/positions`, `/v1/wallets/${SAFE}/portfolio`]) {
      assert.equal(call(new Map(), { path })[0], 503)
    }
  })

  it('refuses rows it cannot turn into Zerion positions', () => {
    const path = `/__test/wallets/${SAFE}/positions`
    for (const body of [
      'not json',
      '{}',
      JSON.stringify({ rows: [{ ...ROWS[0], chainId: '10' }] }),
      JSON.stringify({ rows: [{ ...ROWS[0], quantity: '1e3' }] }),
    ]) {
      assert.equal(call(new Map(), { method: 'POST', path, body })[0], 400)
    }
  })

  it('reports healthy and fails other requests explicitly', () => {
    assert.deepEqual(call(new Map(), { path: '/health' }), [200, { ready: true }])
    assert.equal(call(new Map(), { path: '/v1/fungibles' })[0], 404)
    assert.equal(call(new Map(), { method: 'POST', path: '/v1/chains' })[0], 404)
  })
})
