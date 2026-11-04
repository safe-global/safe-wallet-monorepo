import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { INTERNAL_ERROR_ATTEMPTS, forkUpstream, forward, hasInternalError } from './fork-upstream.ts'
import type { Answer, Post } from './fork-upstream.ts'

const INTERNAL = JSON.stringify({ jsonrpc: '2.0', id: 1, error: { code: -32603, message: 'Internal error' } })
const RESULT = JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x1' })

function upstreamAnswering(...answers: Answer[]): Post & { calls: number } {
  const post = Object.assign(
    async (): Promise<Answer> => {
      post.calls += 1
      const answer = answers.shift()
      if (!answer) throw new Error('No more answers')
      return answer
    },
    { calls: 0 },
  )
  return post
}

const noPause = async (): Promise<void> => {}

describe('fork upstream proxy', () => {
  it('retries a transient internal error', async () => {
    const upstream = upstreamAnswering({ status: 200, body: INTERNAL }, { status: 200, body: RESULT })
    assert.deepEqual(await forward('https://rpc', '{}', upstream, noPause), { status: 200, body: RESULT })
    assert.equal(upstream.calls, 2)
  })

  it('returns the error after the last attempt', async () => {
    const answers = Array.from({ length: INTERNAL_ERROR_ATTEMPTS }, () => ({ status: 200, body: INTERNAL }))
    const upstream = upstreamAnswering(...answers)
    assert.deepEqual(await forward('https://rpc', '{}', upstream, noPause), { status: 200, body: INTERNAL })
    assert.equal(upstream.calls, INTERNAL_ERROR_ATTEMPTS)
  })

  it('passes other errors and statuses through at once', async () => {
    const notFound = JSON.stringify({ error: { code: -32601, message: 'missing' } })
    for (const answer of [
      { status: 200, body: notFound },
      { status: 429, body: 'rate limited' },
      { status: 502, body: '' },
    ]) {
      const upstream = upstreamAnswering(answer)
      assert.deepEqual(await forward('https://rpc', '{}', upstream, noPause), answer)
      assert.equal(upstream.calls, 1)
    }
  })

  it('detects internal errors in batches only by their code', () => {
    assert.equal(hasInternalError(`[${RESULT},${INTERNAL}]`), true)
    assert.equal(hasInternalError(`[${RESULT}]`), false)
    assert.equal(hasInternalError('not json'), false)
    assert.equal(hasInternalError('{"error": null}'), false)
    assert.equal(hasInternalError('null'), false)
  })

  it('counts forwarded requests and refuses empty ones', async () => {
    const handle = forkUpstream('https://rpc', upstreamAnswering({ status: 200, body: RESULT }))
    const empty = await handle({ method: 'POST', path: '/', query: new URLSearchParams(), headers: {}, body: '' })
    assert.equal(empty.status, 400)
    const reply = await handle({ method: 'POST', path: '/', query: new URLSearchParams(), headers: {}, body: '{}' })
    assert.deepEqual([reply.status, reply.body], [200, RESULT])
    const status = await handle({ method: 'GET', path: '/status', query: new URLSearchParams(), headers: {}, body: '' })
    assert.deepEqual(JSON.parse(status.body), { forwarded: 1 })
  })

  it('refuses a missing upstream URL', () => {
    assert.throws(() => forkUpstream(''), /FORK_UPSTREAM_URL/)
  })
})
