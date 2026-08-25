import type { BaseQueryApi } from '@reduxjs/toolkit/query/react'
import * as cgwClient from '../cgwClient'

/**
 * The CGW client issues each request exactly once: nothing wraps its base query
 * in `retry`. A 422 means we sent a malformed request, so re-sending it cannot
 * change the outcome — this pins that it is never re-sent (WA-3252).
 *
 * A retry policy for the transient states (429 / 5xx) is deliberately deferred
 * to its own ticket. Whoever adds it must keep 422 excluded, and this test is
 * what fails if they do not.
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
