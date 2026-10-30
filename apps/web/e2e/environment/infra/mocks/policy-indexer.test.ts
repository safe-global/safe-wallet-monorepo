import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { dispatch } from './policy-indexer.ts'
import type { Binding, Registry, Root } from './policy-indexer.ts'

const SEPOLIA = 11155111
const SAFE = '0x1111111111111111111111111111111111111111'
const OTHER_SAFE = '0x2222222222222222222222222222222222222222'
const GUARD = '0xC83bC185770ac0Da8A970f35695064eEe62e236c'

const binding = (safe: string, kind = 'ERC20_TRANSFER'): Binding => ({
  chainId: SEPOLIA,
  safe,
  guard: GUARD,
  target: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  selector: '0xa9059cbb',
  operation: 'CALL',
  kind,
  policy: '0x25DDa3b8974a10E93ca188F9C149A42F938Bd187',
  state: { recipients: [{ account: '0x3333333333333333333333333333333333333333', permission: 'ALWAYS' }] },
})

const root = (safe: string): Root => ({
  chainId: SEPOLIA,
  safe,
  guard: GUARD,
  root: `0x${'ab'.repeat(32)}`,
  readyAt: '1800000060',
  expiresAt: '1800604860',
  status: 'PENDING',
})

const safeFilter = (chainId: number, safes: string[]) => [{ chainId: { _eq: chainId }, safe: { _in: safes } }]

function query(registry: Registry, variables: unknown): [number, unknown] {
  const reply = dispatch(
    { method: 'POST', path: '/v1/graphql', body: JSON.stringify({ query: '', variables }) },
    registry,
  )
  return [reply.status, JSON.parse(reply.body)]
}

function register(registry: Registry, chainId: number, safe: string, state: unknown): [number, unknown] {
  const path = `/__test/chains/${chainId}/safes/${safe}/guard-policies`
  const reply = dispatch({ method: 'POST', path, body: JSON.stringify(state) }, registry)
  return [reply.status, JSON.parse(reply.body)]
}

const guardQuery = (safes: string[], kinds = ['ERC20_TRANSFER']) => ({
  allowances: safeFilter(SEPOLIA, safes),
  delegates: safeFilter(SEPOLIA, safes),
  guardPolicyBindings: safeFilter(SEPOLIA, safes),
  guardPolicyKinds: kinds,
  roots: safeFilter(SEPOLIA, safes),
})

describe('policy indexer', () => {
  it('answers with every row list the gateway parses, all empty for a Safe with no state', () => {
    assert.deepEqual(query(new Map(), guardQuery([SAFE])), [
      200,
      { data: { _meta: [], SafeAllowance: [], SafeDelegate: [], GuardPolicyBinding: [], ConfigurationRoot: [] } },
    ])
  })

  it('serves the registered bindings and roots of the requested Safe only', () => {
    const registry: Registry = new Map()
    assert.equal(
      register(registry, SEPOLIA, SAFE, { GuardPolicyBinding: [binding(SAFE)], ConfigurationRoot: [root(SAFE)] })[0],
      200,
    )
    assert.equal(register(registry, SEPOLIA, OTHER_SAFE, { GuardPolicyBinding: [binding(OTHER_SAFE)] })[0], 200)

    const [, answer] = query(registry, guardQuery([SAFE.toUpperCase().replace('0X', '0x')]))
    assert.deepEqual(answer, {
      data: {
        _meta: [],
        SafeAllowance: [],
        SafeDelegate: [],
        GuardPolicyBinding: [binding(SAFE)],
        ConfigurationRoot: [root(SAFE)],
      },
    })
  })

  it('leaves out bindings of kinds the query does not ask for', () => {
    const registry: Registry = new Map()
    register(registry, SEPOLIA, SAFE, { GuardPolicyBinding: [binding(SAFE), binding(SAFE, 'COSIGNER')] })
    const [, answer] = query(registry, guardQuery([SAFE], ['ERC20_TRANSFER']))
    assert.deepEqual((answer as { data: { GuardPolicyBinding: Binding[] } }).data.GuardPolicyBinding, [binding(SAFE)])
  })

  it('returns no guard rows when the gateway asks for none, as for spending limits alone', () => {
    const registry: Registry = new Map()
    register(registry, SEPOLIA, SAFE, { GuardPolicyBinding: [binding(SAFE)], ConfigurationRoot: [root(SAFE)] })
    const [, answer] = query(registry, { ...guardQuery([SAFE], []), guardPolicyBindings: [], roots: [] })
    const { data } = answer as { data: { GuardPolicyBinding: Binding[]; ConfigurationRoot: Root[] } }
    assert.deepEqual([data.GuardPolicyBinding, data.ConfigurationRoot], [[], []])
  })

  it('does not serve a Safe on another chain', () => {
    const registry: Registry = new Map()
    register(registry, SEPOLIA, SAFE, { GuardPolicyBinding: [binding(SAFE)] })
    const [, answer] = query(registry, { ...guardQuery([SAFE]), guardPolicyBindings: safeFilter(1, [SAFE]) })
    assert.deepEqual((answer as { data: { GuardPolicyBinding: Binding[] } }).data.GuardPolicyBinding, [])
  })

  it('replaces the state of a Safe on each registration', () => {
    const registry: Registry = new Map()
    register(registry, SEPOLIA, SAFE, { GuardPolicyBinding: [binding(SAFE)], ConfigurationRoot: [root(SAFE)] })
    register(registry, SEPOLIA, SAFE, { ConfigurationRoot: [{ ...root(SAFE), status: 'APPLIED' }] })
    const [, answer] = query(registry, guardQuery([SAFE]))
    const { data } = answer as { data: { GuardPolicyBinding: Binding[]; ConfigurationRoot: Root[] } }
    assert.deepEqual(data.GuardPolicyBinding, [])
    assert.deepEqual(
      data.ConfigurationRoot.map(({ status }) => status),
      ['APPLIED'],
    )
  })

  it('refuses rows of another Safe, an unknown root status and times that are not decimal strings', () => {
    const registry: Registry = new Map()
    assert.equal(register(registry, SEPOLIA, SAFE, { GuardPolicyBinding: [binding(OTHER_SAFE)] })[0], 400)
    assert.equal(register(registry, SEPOLIA, SAFE, { ConfigurationRoot: [{ ...root(SAFE), status: 'DONE' }] })[0], 400)
    assert.equal(
      register(registry, SEPOLIA, SAFE, { ConfigurationRoot: [{ ...root(SAFE), readyAt: 1800000060 }] })[0],
      400,
    )
    assert.equal(register(registry, SEPOLIA, SAFE, { GuardPolicyBinding: 'none' })[0], 400)
    assert.equal(registry.size, 0)
  })

  it('reports healthy', () => {
    assert.deepEqual(dispatch({ method: 'GET', path: '/health', body: '' }, new Map()).status, 200)
  })

  it('fails other requests explicitly', () => {
    assert.equal(dispatch({ method: 'GET', path: '/v1/graphql', body: '' }, new Map()).status, 404)
    assert.equal(dispatch({ method: 'POST', path: '/v2/graphql', body: '' }, new Map()).status, 404)
  })
})
