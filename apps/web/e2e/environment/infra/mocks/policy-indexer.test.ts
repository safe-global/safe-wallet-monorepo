import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { EMPTY_STATE, dispatch } from './policy-indexer.ts'

function call(method: string, path: string): [number, unknown] {
  const reply = dispatch({ method, path })
  return [reply.status, JSON.parse(reply.body)]
}

describe('policy indexer', () => {
  it('answers the state query with no allowances and no delegates', () => {
    assert.deepEqual(call('POST', '/v1/graphql'), [200, { data: EMPTY_STATE }])
  })

  it('reports healthy', () => {
    assert.deepEqual(call('GET', '/health'), [200, { ready: true }])
  })

  it('fails other requests explicitly', () => {
    assert.equal(call('GET', '/v1/graphql')[0], 404)
    assert.equal(call('POST', '/v2/graphql')[0], 404)
  })
})
