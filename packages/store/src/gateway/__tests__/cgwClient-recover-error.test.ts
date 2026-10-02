import type { BaseQueryApi } from '@reduxjs/toolkit/query/react'
import * as cgwClient from '../cgwClient'

const api: BaseQueryApi = {
  dispatch: jest.fn(),
  getState: jest.fn(),
  abort: jest.fn(),
  signal: new AbortController().signal,
  extra: {},
  endpoint: 'testEndpoint',
  type: 'mutation',
}

const forbidden = { error: { status: 403, data: { message: 'elevation_required' } } }
const ok = { data: { id: 1 } }

describe('cgwClient recover error hook', () => {
  const mockRawBaseQuery = jest.spyOn(cgwClient, 'rawBaseQuery')

  beforeEach(() => {
    jest.resetAllMocks()
    cgwClient.setBaseUrl('http://example.com')
  })

  afterAll(() => {
    cgwClient.setRecoverErrorHook(async () => false)
  })

  it('sends the request again once when the hook recovers the error', async () => {
    const hook = jest.fn().mockResolvedValue(true)
    cgwClient.setRecoverErrorHook(hook)
    mockRawBaseQuery.mockResolvedValueOnce(forbidden as never).mockResolvedValueOnce(ok as never)

    const result = await cgwClient.dynamicBaseQuery({ url: '/v1/spaces/1', method: 'PATCH', body: { a: 1 } }, api, {})

    expect(result).toEqual(ok)
    expect(hook).toHaveBeenCalledWith(forbidden.error)
    expect(mockRawBaseQuery).toHaveBeenCalledTimes(2)
    expect(mockRawBaseQuery.mock.calls[1][0]).toEqual(mockRawBaseQuery.mock.calls[0][0])
  })

  it('returns the error of the second attempt without a third attempt', async () => {
    cgwClient.setRecoverErrorHook(jest.fn().mockResolvedValue(true))
    mockRawBaseQuery.mockResolvedValue(forbidden as never)

    const result = await cgwClient.dynamicBaseQuery('/v1/spaces/1', api, {})

    expect(result).toEqual(forbidden)
    expect(mockRawBaseQuery).toHaveBeenCalledTimes(2)
  })

  it('returns the original error when the hook does not recover it', async () => {
    cgwClient.setRecoverErrorHook(jest.fn().mockResolvedValue(false))
    mockRawBaseQuery.mockResolvedValue(forbidden as never)

    const result = await cgwClient.dynamicBaseQuery('/v1/spaces/1', api, {})

    expect(result).toEqual(forbidden)
    expect(mockRawBaseQuery).toHaveBeenCalledTimes(1)
  })

  it('does not call the hook for a successful response', async () => {
    const hook = jest.fn().mockResolvedValue(true)
    cgwClient.setRecoverErrorHook(hook)
    mockRawBaseQuery.mockResolvedValue(ok as never)

    await cgwClient.dynamicBaseQuery('/v1/spaces/1', api, {})

    expect(hook).not.toHaveBeenCalled()
    expect(mockRawBaseQuery).toHaveBeenCalledTimes(1)
  })
})
