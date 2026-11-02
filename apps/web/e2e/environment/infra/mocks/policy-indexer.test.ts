import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { dispatch, topLevelFields } from './policy-indexer.ts'

// The gateway's PolicyIndexerState query, as of safe-client-gateway f5e1d80.
const GATEWAY_QUERY = `query PolicyIndexerState(
  $allowances: [SafeAllowance_bool_exp!]!
  $delegates: [SafeDelegate_bool_exp!]!
  $guardPolicyBindings: [SafePolicy_bool_exp!]!
  $guardPolicyKinds: [policykind!]!
  $roots: [ConfigurationRoot_bool_exp!]!
) {
  _meta { chainId progressBlock sourceBlock isReady }
  SafeAllowance(
    where: { _or: $allowances }
    order_by: [{ chainId: asc }, { safe: asc }, { delegate: asc }, { token: asc }]
  ) {
    chainId safe module moduleVersion delegate token
    amount spent remaining resetTimeMinutes lastResetMin resetPhase nonce createdAt updatedAt
  }
  SafeDelegate(
    where: { _or: $delegates }
    order_by: [{ chainId: asc }, { safe: asc }, { delegate: asc }]
  ) {
    chainId safe module moduleVersion delegate active addedAt updatedAt
  }
  GuardPolicyBinding: SafePolicy(
    where: { _or: $guardPolicyBindings, active: { _eq: true }, kind: { _in: $guardPolicyKinds } }
    order_by: [{ chainId: asc }, { safe: asc }, { target: asc }, { selector: asc }]
  ) {
    chainId safe guard target selector operation kind policy state
  }
  ConfigurationRoot(
    where: { _or: $roots }
    order_by: [{ chainId: asc }, { safe: asc }, { readyAt: asc }]
  ) {
    chainId safe guard root readyAt expiresAt status
  }
}`

function call(method: string, path: string, body = ''): [number, unknown] {
  const reply = dispatch({ method, path, body })
  return [reply.status, JSON.parse(reply.body)]
}

describe('policy indexer', () => {
  it("answers each field of the gateway's query, under its alias, with no state", () => {
    const body = JSON.stringify({ query: GATEWAY_QUERY, variables: {} })
    assert.deepEqual(call('POST', '/v1/graphql', body), [
      200,
      { data: { _meta: [], SafeAllowance: [], SafeDelegate: [], GuardPolicyBinding: [], ConfigurationRoot: [] } },
    ])
  })

  it('reads the fields of an anonymous query', () => {
    assert.deepEqual(topLevelFields('{ _meta { chainId } SafePolicy(where: { safe: { _eq: "0x1" } }) { kind } }'), [
      '_meta',
      'SafePolicy',
    ])
  })

  it('rejects a request without query fields', () => {
    assert.equal(call('POST', '/v1/graphql', 'not json')[0], 400)
    assert.equal(call('POST', '/v1/graphql', JSON.stringify({ variables: {} }))[0], 400)
    assert.equal(call('POST', '/v1/graphql', JSON.stringify({ query: '{}' }))[0], 400)
  })

  it('reports healthy', () => {
    assert.deepEqual(call('GET', '/health'), [200, { ready: true }])
  })

  it('fails other requests explicitly', () => {
    assert.equal(call('GET', '/v1/graphql')[0], 404)
    assert.equal(call('POST', '/v2/graphql')[0], 404)
  })
})
