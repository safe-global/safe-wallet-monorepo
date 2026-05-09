import { http, HttpResponse } from 'msw'
import { balanceMocks, collectibleMocks, createEmptyHistory } from '../factories'

/**
 * Empty state scenario handlers
 *
 * Use these handlers to simulate a Safe with no transactions, balances, or collectibles.
 * Useful for testing empty states and onboarding flows.
 */

export const createEmptyStateHandlers = (GATEWAY_URL: string) => [
  // Empty balances
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/balances/:currency`, () => {
    return HttpResponse.json(balanceMocks.empty())
  }),

  // Empty collectibles
  http.get(`${GATEWAY_URL}/v2/chains/:chainId/safes/:safeAddress/collectibles`, () => {
    return HttpResponse.json(collectibleMocks.empty())
  }),

  // Empty transaction queue
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`, () => {
    return HttpResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
  }),

  // Empty transaction history
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/history`, () => {
    return HttpResponse.json(createEmptyHistory())
  }),

  // Empty messages
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/messages`, () => {
    return HttpResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
  }),
]

/**
 * Handlers specifically for new Safe without any activity
 */
export const createNewSafeHandlers = (GATEWAY_URL: string) => [
  ...createEmptyStateHandlers(GATEWAY_URL),

  // Safe info with nonce 0
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, () => {
    return HttpResponse.json({
      address: '0x1234567890123456789012345678901234567890',
      nonce: 0,
      threshold: 2,
      owners: ['0x1111111111111111111111111111111111111111', '0x2222222222222222222222222222222222222222'],
      masterCopy: '0xd9Db270c1B5E3Bd161E8c8503c55cEFDDe8E6766',
      modules: [],
      fallbackHandler: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
      guard: '0x0000000000000000000000000000000000000000',
      version: '1.3.0',
    })
  }),
]
