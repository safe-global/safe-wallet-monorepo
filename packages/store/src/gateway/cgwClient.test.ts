import type { FetchArgs, BaseQueryApi } from '@reduxjs/toolkit/query/react'
import * as cgwClient from './cgwClient'

describe('dynamicBaseQuery', () => {
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
  })

  it('throws an error if baseUrl is not set', async () => {
    // Note: We do NOT set baseUrl here, so it remains null by default.
    await expect(cgwClient.dynamicBaseQuery('/test', api, {})).rejects.toThrow(
      'baseUrl not set. Call setBaseUrl before using the cgwClient',
    )
  })

  it('calls rawBaseQuery with correct url when baseUrl is set and args is a string', async () => {
    mockRawBaseQuery.mockResolvedValue({ data: 'stringResult' })
    // Set the baseUrl
    cgwClient.setBaseUrl('http://example.com')

    const result = await cgwClient.dynamicBaseQuery('/test', api, {})

    expect(mockRawBaseQuery).toHaveBeenCalledWith(
      {
        method: 'GET',
        url: 'http://example.com/test',
        credentials: 'omit',
      },
      api,
      {},
    )
    expect(result).toEqual({ data: 'stringResult' })
  })

  it('calls rawBaseQuery with correct url when baseUrl is set and args is FetchArgs', async () => {
    mockRawBaseQuery.mockResolvedValue({ data: 'objectResult' })
    cgwClient.setBaseUrl('http://example.com')

    const args: FetchArgs = { url: 'endpoint', method: 'POST', body: { hello: 'world' } }
    const extraOptions = { extra: 'options' }

    const result = await cgwClient.dynamicBaseQuery(args, api, extraOptions)

    expect(mockRawBaseQuery).toHaveBeenCalledWith(
      {
        url: 'http://example.comendpoint',
        method: 'POST',
        body: { hello: 'world' },
        credentials: 'omit',
      },
      api,
      extraOptions,
    )
    expect(result).toEqual({ data: 'objectResult' })
  })

  it.each([
    '/v1/auth',
    '/v2/register/notifications',
    `/v2/chains/1/notifications/devices/${crypto.randomUUID()}/safes/0x0000000000000000000000000000000000000000`,
    '/v2/chains/1/notifications/devices/0x0000000000000000000000000000000000000000',
  ])('calls rawBaseQuery with credentials for %s', async (url) => {
    const mockRawBaseQuery = jest.spyOn(cgwClient, 'rawBaseQuery')
    mockRawBaseQuery.mockResolvedValue({ data: 'objectResult' })
    cgwClient.setBaseUrl('http://example.com')

    const args: FetchArgs = { url, method: 'POST', body: { hello: 'world' } }
    const extraOptions = { credentials: 'include' }

    const result = await cgwClient.dynamicBaseQuery(args, api, extraOptions)

    expect(mockRawBaseQuery).toHaveBeenCalledWith(
      {
        url: `http://example.com${url}`,
        method: 'POST',
        body: { hello: 'world' },
        credentials: 'include',
      },
      api,
      extraOptions,
    )
    expect(result).toEqual({ data: 'objectResult' })
  })
})
