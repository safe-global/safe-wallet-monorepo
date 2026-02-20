import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { configureStore } from '@reduxjs/toolkit'
import { createMockChain } from '@safe-global/test'
import { apiSliceWithChainsConfig } from '../index'
import { setBaseUrl } from '../../cgwClient'

const GATEWAY_URL = 'https://test-gateway.safe.global'

const mockChains = [
  createMockChain({ chainId: '1', chainName: 'Ethereum', shortName: 'eth' }),
  createMockChain({ chainId: '137', chainName: 'Polygon', shortName: 'matic', l2: true }),
  createMockChain({ chainId: '42161', chainName: 'Arbitrum One', shortName: 'arb1', l2: true }),
]

type TestStore = ReturnType<
  typeof configureStore<{
    api: ReturnType<typeof apiSliceWithChainsConfig.reducer>
  }>
>

describe('chains retry functionality', () => {
  let server: ReturnType<typeof setupServer>
  let store: TestStore

  beforeAll(() => {
    setBaseUrl(GATEWAY_URL)
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    store = configureStore({
      reducer: {
        [apiSliceWithChainsConfig.reducerPath]: apiSliceWithChainsConfig.reducer,
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSliceWithChainsConfig.middleware),
    })
  })

  afterEach(() => {
    if (server) {
      server.close()
    }
    jest.clearAllTimers()
  })

  describe('successful responses', () => {
    it('should fetch chains successfully on first attempt', async () => {
      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains`, () => {
          return HttpResponse.json({
            results: mockChains,
            next: null,
          })
        }),
      )
      server.listen()

      const result = await store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())

      expect(result.isSuccess).toBe(true)
      expect(result.data?.entities).toBeDefined()
      expect(Object.keys(result.data?.entities ?? {}).length).toBe(3)
      expect(result.data?.entities['1']).toMatchObject({
        chainId: '1',
        chainName: 'Ethereum',
      })
    })

    it('should handle paginated responses correctly', async () => {
      const page1Chains = [mockChains[0], mockChains[1]]
      const page2Chains = [mockChains[2]]

      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains`, ({ request }) => {
          const url = new URL(request.url)
          const cursor = url.searchParams.get('cursor')

          if (cursor !== 'page2') {
            return HttpResponse.json({
              results: page1Chains,
              next: `${GATEWAY_URL}/v1/chains?cursor=page2`,
            })
          }

          return HttpResponse.json({
            results: page2Chains,
            next: null,
          })
        }),
      )
      server.listen()

      const result = await store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())

      expect(result.isSuccess).toBe(true)
      expect(Object.keys(result.data?.entities ?? {}).length).toBe(3)
      expect(result.data?.entities['1']).toBeDefined()
      expect(result.data?.entities['137']).toBeDefined()
      expect(result.data?.entities['42161']).toBeDefined()
    })
  })

  describe('retry behavior', () => {
    it('should retry on network errors and succeed after N retries', async () => {
      let attemptCount = 0

      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains`, () => {
          attemptCount++

          if (attemptCount < 3) {
            return HttpResponse.error()
          }

          return HttpResponse.json({
            results: mockChains,
            next: null,
          })
        }),
      )
      server.listen()

      const promise = store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())
      await jest.runAllTimersAsync()
      const result = await promise

      expect(result.isSuccess).toBe(true)
      expect(attemptCount).toBe(3)
      expect(Object.keys(result.data?.entities ?? {}).length).toBe(3)
    })

    it('should retry on 5xx server errors', async () => {
      let attemptCount = 0

      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains`, () => {
          attemptCount++

          if (attemptCount < 2) {
            return new HttpResponse(null, { status: 503 })
          }

          return HttpResponse.json({
            results: mockChains,
            next: null,
          })
        }),
      )
      server.listen()

      const promise = store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())
      await jest.runAllTimersAsync()
      const result = await promise

      expect(result.isSuccess).toBe(true)
      expect(attemptCount).toBe(2)
    })

    it('should stop retrying after a successful response', async () => {
      let attemptCount = 0

      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains`, () => {
          attemptCount++
          return HttpResponse.json({
            results: mockChains,
            next: null,
          })
        }),
      )
      server.listen()

      const result = await store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())

      expect(result.isSuccess).toBe(true)
      expect(attemptCount).toBe(1)
    })

    it('should respect maximum retry limit (5 retries)', async () => {
      let attemptCount = 0

      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains`, () => {
          attemptCount++
          return HttpResponse.error()
        }),
      )
      server.listen()

      const promise = store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())
      await jest.runAllTimersAsync()
      const result = await promise

      expect(result.isError).toBe(true)
      expect(attemptCount).toBe(6)
    })
  })

  describe('error handling', () => {
    it('should return error after max retries exhausted', async () => {
      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains`, () => {
          return HttpResponse.error()
        }),
      )
      server.listen()

      const promise = store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())
      await jest.runAllTimersAsync()
      const result = await promise

      expect(result.isError).toBe(true)
      expect(result.error).toBeDefined()
    })
  })

  describe('pagination with retries', () => {
    it('should retry failed pagination requests', async () => {
      let page1Attempts = 0
      let page2Attempts = 0

      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains`, ({ request }) => {
          const url = new URL(request.url)
          const cursor = url.searchParams.get('cursor')

          if (cursor !== 'page2') {
            page1Attempts++
            if (page1Attempts < 2) {
              return HttpResponse.error()
            }
            return HttpResponse.json({
              results: [mockChains[0]],
              next: `${GATEWAY_URL}/v1/chains?cursor=page2`,
            })
          }

          page2Attempts++
          if (page2Attempts < 2) {
            return HttpResponse.error()
          }
          return HttpResponse.json({
            results: [mockChains[1]],
            next: null,
          })
        }),
      )
      server.listen()

      const promise = store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())
      await jest.runAllTimersAsync()
      const result = await promise

      expect(result.isSuccess).toBe(true)
      expect(page1Attempts).toBe(2)
      expect(page2Attempts).toBe(2)
      expect(Object.keys(result.data?.entities ?? {}).length).toBe(2)
    })

    it('should fail pagination if max retries exceeded on any page', async () => {
      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains`, ({ request }) => {
          const url = new URL(request.url)
          const cursor = url.searchParams.get('cursor')

          if (cursor !== 'page2') {
            return HttpResponse.json({
              results: [mockChains[0]],
              next: `${GATEWAY_URL}/v1/chains?cursor=page2`,
            })
          }

          return HttpResponse.error()
        }),
      )
      server.listen()

      const promise = store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())
      await jest.runAllTimersAsync()
      const result = await promise

      expect(result.isError).toBe(true)
    })
  })

  describe('adapter integration', () => {
    it('should normalize chains data using adapter', async () => {
      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains`, () => {
          return HttpResponse.json({
            results: mockChains,
            next: null,
          })
        }),
      )
      server.listen()

      const result = await store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())

      expect(result.isSuccess).toBe(true)

      const state = result.data!
      expect(state.ids).toEqual(['1', '137', '42161'])
      expect(state.entities['1']?.chainId).toBe('1')
      expect(state.entities['137']?.chainId).toBe('137')
      expect(state.entities['42161']?.chainId).toBe('42161')
    })

    it('should use chainId as entity selector', async () => {
      const customChain = createMockChain({ chainId: '999', chainName: 'Test Chain' })

      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains`, () => {
          return HttpResponse.json({
            results: [customChain],
            next: null,
          })
        }),
      )
      server.listen()

      const result = await store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())

      expect(result.isSuccess).toBe(true)
      expect(result.data?.ids).toContain('999')
      expect(result.data?.entities['999']?.chainName).toBe('Test Chain')
    })
  })
})
