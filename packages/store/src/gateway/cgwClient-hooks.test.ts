import type { BaseQueryApi } from '@reduxjs/toolkit/query/react'
import * as cgwClient from './cgwClient'

/**
 * I had to move these tests to a separate file, otherwise they were failing when ran with the other tests.
 * I think it has to do with the way we import the cgwClient
 */
describe('cgwClient hooks', () => {
  let testApi: BaseQueryApi
  let originalFetch: typeof global.fetch

  beforeAll(() => {
    cgwClient.setBaseUrl('https://test.com')
  })

  beforeEach(() => {
    originalFetch = global.fetch
    // Mock fetch for all tests in this describe block
    // Ensure the mocked response has a headers object for the prepareHeaders test
    global.fetch = jest.fn().mockResolvedValue(
      new Response('{}', { status: 200, headers: new Headers() }), // Headers need to be mutable for set
    )

    // Reset hooks to default implementations
    cgwClient.setPrepareHeadersHook((headers) => headers)
    cgwClient.setHandleResponseHook(() => {})

    testApi = {
      dispatch: jest.fn(),
      getState: jest.fn(),
      abort: jest.fn(),
      signal: new AbortController().signal,
      type: 'query' as const, // Ensure 'type' is treated as a literal type
      endpoint: 'testEndpoint',
      extra: {},
    } as BaseQueryApi // Cast to BaseQueryApi
  })

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch
  })

  it('should call custom prepareHeadersHook and set header when fetchBaseQuery is used', async () => {
    const mockHeaderFunction = jest.fn((headers: Headers) => {
      headers.set('X-Test-Header', 'test-value')
      return headers
    })

    cgwClient.setPrepareHeadersHook(mockHeaderFunction)

    await cgwClient.dynamicBaseQuery('/test-prepare-headers', testApi, {})

    expect(mockHeaderFunction).toHaveBeenCalled()

    const mockFetch = global.fetch as jest.Mock
    expect(mockFetch).toHaveBeenCalled()
    const request = mockFetch.mock.calls[0][0] as Request
    expect(request.headers.get('X-Test-Header')).toBe('test-value')
  })

  it('should call custom handleResponseHook when fetchBaseQuery is used', async () => {
    const mockResponseFunction = jest.fn()
    cgwClient.setHandleResponseHook(mockResponseFunction)

    await cgwClient.dynamicBaseQuery('/test-response', testApi, {})

    const mockFetch = global.fetch as jest.Mock
    expect(mockFetch).toHaveBeenCalled()

    expect(mockResponseFunction).toHaveBeenCalled()
    expect(mockResponseFunction).toHaveBeenCalledWith(
      expect.any(Response),
      '/test-response',
      expect.objectContaining({ api: testApi, args: { url: '/test-response' } }),
    )
  })

  it('should pass the parsed error to the response hooks when the request fails', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(new Response('{"message":"nope"}', { status: 403, headers: new Headers() }))
    const mockResponseFunction = jest.fn()
    cgwClient.setHandleResponseHook(mockResponseFunction)

    await cgwClient.dynamicBaseQuery('/test-error', testApi, {})

    expect(mockResponseFunction).toHaveBeenCalledWith(
      expect.any(Response),
      '/test-error',
      expect.objectContaining({ error: { status: 403, data: { message: 'nope' } } }),
    )
  })

  it('should run an added hook next to the set one, and stop running it once removed', async () => {
    // Two requests: each needs its own Response, a body can only be read once.
    global.fetch = jest.fn(() => Promise.resolve(new Response('{}', { status: 200, headers: new Headers() })))
    const setHook = jest.fn()
    const addedHook = jest.fn()
    cgwClient.setHandleResponseHook(setHook)
    const remove = cgwClient.addHandleResponseHook(addedHook)

    await cgwClient.dynamicBaseQuery('/test-hooks', testApi, {})
    expect(setHook).toHaveBeenCalledTimes(1)
    expect(addedHook).toHaveBeenCalledTimes(1)

    remove()
    await cgwClient.dynamicBaseQuery('/test-hooks', testApi, {})
    expect(setHook).toHaveBeenCalledTimes(2)
    expect(addedHook).toHaveBeenCalledTimes(1)
  })

  it('should, when a hook is set, drop the hooks added before it', async () => {
    const addedHook = jest.fn()
    cgwClient.addHandleResponseHook(addedHook)
    cgwClient.setHandleResponseHook(() => {})

    await cgwClient.dynamicBaseQuery('/test-replace', testApi, {})

    expect(addedHook).not.toHaveBeenCalled()
  })
})
