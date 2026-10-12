import type { FetchArgs, BaseQueryApi } from '@reduxjs/toolkit/query/react'
import * as cgwClient from './cgwClient'
import { faker } from '@faker-js/faker'

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

  describe('404 as an empty list', () => {
    const subscriptionsUrl = '/v1/billing/spaces/e5bfa406-7b05-48fd-9b7e-88a1efb20495/subscriptions'
    const notFound = { error: { status: 404, data: { message: 'Not Found' } }, meta: { request: {}, response: {} } }

    beforeEach(() => cgwClient.setBaseUrl('http://example.com'))

    it('resolves a 404 on the subscriptions route as an empty list', async () => {
      mockRawBaseQuery.mockResolvedValue(notFound as never)

      const result = await cgwClient.dynamicBaseQuery({ url: subscriptionsUrl }, api, {})

      expect(result).toEqual({ data: [], meta: notFound.meta })
    })

    it('keeps the 404 for the subscriptions route with a query string as an empty list', async () => {
      mockRawBaseQuery.mockResolvedValue(notFound as never)

      const result = await cgwClient.dynamicBaseQuery({ url: `${subscriptionsUrl}?status=active` }, api, {})

      expect(result).toEqual({ data: [], meta: notFound.meta })
    })

    it('keeps a 404 on any other route as an error', async () => {
      mockRawBaseQuery.mockResolvedValue(notFound as never)

      const result = await cgwClient.dynamicBaseQuery({ url: '/v1/spaces/e5bfa406' }, api, {})

      expect(result).toEqual(notFound)
    })

    it('keeps other statuses on the subscriptions route as errors', async () => {
      const rateLimited = { error: { status: 429, data: {} }, meta: {} }
      mockRawBaseQuery.mockResolvedValue(rateLimited as never)

      const result = await cgwClient.dynamicBaseQuery({ url: subscriptionsUrl }, api, {})

      expect(result).toEqual(rateLimited)
    })
  })

  it.each([
    '/v1/auth',
    '/v1/billing/spaces/e5bfa406-7b05-48fd-9b7e-88a1efb20495/payment-links',
    '/v2/register/notifications',
    `/v2/chains/1/notifications/devices/${faker.string.uuid()}/safes/0x0000000000000000000000000000000000000000`,
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

  it.each([
    '/v1/chains//about/indexing',
    '/v1/chains//safes//messages',
    '/v1/chains/1/safes//balances/usd',
    '/v1/chains//safes/0x0000000000000000000000000000000000000000/messages',
  ])('refuses to request %s', async (url) => {
    mockRawBaseQuery.mockResolvedValue({ data: 'objectResult' })
    cgwClient.setBaseUrl('http://example.com')

    const result = await cgwClient.dynamicBaseQuery(url, api, {})

    expect(mockRawBaseQuery).not.toHaveBeenCalled()
    expect(result).toEqual({
      error: { status: 'CUSTOM_ERROR', error: `Refusing to request ${url}: a path parameter is empty` },
    })
  })

  it.each([
    '/v1/chains/1/about/indexing',
    '/v1/chains/1/safes/0x0000000000000000000000000000000000000000/messages',
    // `//` inside a query string is data, not an empty path segment
    '/v1/chains/1/safes/0x0000000000000000000000000000000000000000/transactions/history?cursor=a//b',
  ])('still requests %s', async (url) => {
    mockRawBaseQuery.mockResolvedValue({ data: 'objectResult' })
    cgwClient.setBaseUrl('http://example.com')

    const result = await cgwClient.dynamicBaseQuery(url, api, {})

    expect(mockRawBaseQuery).toHaveBeenCalled()
    expect(result).toEqual({ data: 'objectResult' })
  })
})
