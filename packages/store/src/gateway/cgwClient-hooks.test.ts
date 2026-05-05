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
    expect(mockResponseFunction).toHaveBeenCalledWith(expect.any(Response), '/test-response')
  })

  it('runs every registered response hook in registration order', async () => {
    const callOrder: string[] = []
    const hookA = jest.fn(() => {
      callOrder.push('A')
    })
    const hookB = jest.fn(() => {
      callOrder.push('B')
    })

    cgwClient.addHandleResponseHook(hookA)
    cgwClient.addHandleResponseHook(hookB)

    await cgwClient.dynamicBaseQuery('/test-multi-hook', testApi, {})

    expect(hookA).toHaveBeenCalledTimes(1)
    expect(hookB).toHaveBeenCalledTimes(1)
    expect(callOrder).toEqual(['A', 'B'])
  })

  it('continues invoking subsequent hooks when an earlier one throws', async () => {
    const failing = jest.fn(() => {
      throw new Error('hook failed')
    })
    const succeeding = jest.fn()

    cgwClient.addHandleResponseHook(failing)
    cgwClient.addHandleResponseHook(succeeding)

    await cgwClient.dynamicBaseQuery('/test-hook-isolation', testApi, {})

    expect(failing).toHaveBeenCalled()
    expect(succeeding).toHaveBeenCalled()
  })

  it('addHandleResponseHook returns a deregistration function', async () => {
    const hook = jest.fn()
    const deregister = cgwClient.addHandleResponseHook(hook)

    deregister()

    await cgwClient.dynamicBaseQuery('/test-deregister', testApi, {})
    expect(hook).not.toHaveBeenCalled()
  })

  it('setHandleResponseHook still replaces previously registered hooks (back-compat)', async () => {
    const previous = jest.fn()
    const replacement = jest.fn()

    cgwClient.addHandleResponseHook(previous)
    cgwClient.setHandleResponseHook(replacement)

    await cgwClient.dynamicBaseQuery('/test-replace', testApi, {})

    expect(previous).not.toHaveBeenCalled()
    expect(replacement).toHaveBeenCalled()
  })
})
