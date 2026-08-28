import type { BaseQueryApi } from '@reduxjs/toolkit/query/react'
import * as cgwClient from '../cgwClient'

/**
 * Pins that `dynamicBaseQuery` itself issues each request exactly once: it does
 * not retry internally. A 422 means we sent a malformed request, so re-sending
 * it cannot change the outcome (WA-3252).
 *
 * Scope — what this does NOT cover. It calls `dynamicBaseQuery` directly, so it
 * says nothing about retries layered *above* it:
 *  - `gateway/chains/index.ts` already wraps it in `retry(…, { maxRetries: 5 })`
 *    with no `retryCondition`, so chain-config requests DO retry, 422 included.
 *  - A `retry()` added at `createApi`/endpoint level would likewise be invisible
 *    here.
 *
 * So "CGW requests are never retried" is not a repo-wide property; it holds for
 * this base query, which is the propose/submission path. A retry policy for the
 * transient states (429 / 5xx) is deferred to its own ticket; whoever adds one
 * must keep 422 excluded and must extend this pin to the wrapper they touch,
 * because this test alone will not catch them.
 */
describe('cgwClient request attempts', () => {
  const api: BaseQueryApi = {
    dispatch: jest.fn(),
    getState: jest.fn(),
    abort: jest.fn(),
    signal: new AbortController().signal,
    extra: {},
    endpoint: 'testEndpoint',
    type: 'query',
  }

  const mockRawBaseQuery = jest.spyOn(cgwClient, 'rawBaseQuery')

  beforeEach(() => {
    jest.resetAllMocks()
    cgwClient.setBaseUrl('http://example.com')
  })

  it.each([422, 451, 404, 429, 502])('sends a request that fails with %s exactly once', async (status) => {
    mockRawBaseQuery.mockResolvedValue({ error: { status, data: {} } } as never)

    await cgwClient.dynamicBaseQuery('/test', api, {})

    expect(mockRawBaseQuery).toHaveBeenCalledTimes(1)
  })
})
