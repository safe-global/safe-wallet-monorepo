import { http, HttpResponse, delay } from 'msw'
import { createMockSafeInfo, safeMocks } from '../factories/safeFactory'
import { balanceMocks, collectibleMocks } from '../factories/tokenFactory'

/**
 * Loading state scenario handlers
 *
 * Use these handlers to simulate slow API responses for testing loading states.
 * Useful for testing skeletons, loading indicators, and progressive loading.
 */

const DEFAULT_DELAY = 2000 // 2 seconds

/**
 * Create handlers with configurable delay for all endpoints
 */
export const createLoadingHandlers = (GATEWAY_URL: string, delayMs = DEFAULT_DELAY) => [
  // Safe info with delay
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, async () => {
    await delay(delayMs)
    return HttpResponse.json(createMockSafeInfo())
  }),

  // Balances with delay
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/balances/:currency`, async () => {
    await delay(delayMs)
    return HttpResponse.json(balanceMocks.diversified())
  }),

  // Collectibles with delay
  http.get(`${GATEWAY_URL}/v2/chains/:chainId/safes/:safeAddress/collectibles`, async () => {
    await delay(delayMs)
    return HttpResponse.json(collectibleMocks.multiple())
  }),

  // Transaction queue with delay
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`, async () => {
    await delay(delayMs)
    return HttpResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
  }),

  // Transaction history with delay
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/history`, async () => {
    await delay(delayMs)
    return HttpResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
  }),
]

/**
 * Create handlers with staggered loading times
 * Useful for testing progressive loading behavior
 */
export const createStaggeredLoadingHandlers = (GATEWAY_URL: string) => [
  // Safe info loads fast (500ms)
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, async () => {
    await delay(500)
    return HttpResponse.json(safeMocks.standard())
  }),

  // Balances load medium (1500ms)
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/balances/:currency`, async () => {
    await delay(1500)
    return HttpResponse.json(balanceMocks.diversified())
  }),

  // Collectibles load slow (3000ms)
  http.get(`${GATEWAY_URL}/v2/chains/:chainId/safes/:safeAddress/collectibles`, async () => {
    await delay(3000)
    return HttpResponse.json(collectibleMocks.multiple())
  }),

  // Transactions load very slow (4000ms)
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`, async () => {
    await delay(4000)
    return HttpResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
  }),

  // History loads last (5000ms)
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/history`, async () => {
    await delay(5000)
    return HttpResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
  }),
]

/**
 * Create handlers with infinite loading (for testing loading states)
 * Note: These will never resolve, use for visual testing of loading states only
 */
export const createInfiniteLoadingHandlers = (GATEWAY_URL: string) => [
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, async () => {
    await delay('infinite')
    return HttpResponse.json({})
  }),

  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/balances/:currency`, async () => {
    await delay('infinite')
    return HttpResponse.json({})
  }),

  http.get(`${GATEWAY_URL}/v2/chains/:chainId/safes/:safeAddress/collectibles`, async () => {
    await delay('infinite')
    return HttpResponse.json({})
  }),

  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`, async () => {
    await delay('infinite')
    return HttpResponse.json({})
  }),
]

/**
 * Create handlers with partial loading
 * Some endpoints load fast, others are slow
 */
export const createPartialLoadingHandlers = (
  GATEWAY_URL: string,
  slowEndpoints: Array<'balances' | 'transactions' | 'collectibles' | 'safe'>,
  slowDelayMs = 5000,
) => {
  const handlers = []
  const fastDelay = 200
  const slowDelay = slowDelayMs

  // Safe info
  handlers.push(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, async () => {
      await delay(slowEndpoints.includes('safe') ? slowDelay : fastDelay)
      return HttpResponse.json(safeMocks.standard())
    }),
  )

  // Balances
  handlers.push(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/balances/:currency`, async () => {
      await delay(slowEndpoints.includes('balances') ? slowDelay : fastDelay)
      return HttpResponse.json(balanceMocks.diversified())
    }),
  )

  // Collectibles
  handlers.push(
    http.get(`${GATEWAY_URL}/v2/chains/:chainId/safes/:safeAddress/collectibles`, async () => {
      await delay(slowEndpoints.includes('collectibles') ? slowDelay : fastDelay)
      return HttpResponse.json(collectibleMocks.multiple())
    }),
  )

  // Transactions
  handlers.push(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`, async () => {
      await delay(slowEndpoints.includes('transactions') ? slowDelay : fastDelay)
      return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
    }),
  )

  return handlers
}
