import { http, HttpResponse } from 'msw'
import type { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import type { MasterCopy } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

const defaultMasterCopies: MasterCopy[] = [
  {
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEFDDe8E6766',
    version: '1.3.0',
  },
  {
    address: '0x6851D6fDFAfD08c0EF60ac1b9c90E5dE6247cEAC',
    version: '1.4.1',
  },
]

/**
 * Safe-related MSW handlers for Storybook stories
 */
export const createSafeHandlers = (GATEWAY_URL: string) => [
  // Auth nonce endpoint
  http.get(`${GATEWAY_URL}/v1/auth/nonce`, () => {
    return HttpResponse.json({
      nonce: 'mock-nonce-for-testing-12345',
      timestamp: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 300000).toISOString(),
    })
  }),

  // Safe info endpoint
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, () => {
    return HttpResponse.json({
      address: '0x1234567890123456789012345678901234567890',
      nonce: 0,
      threshold: 2,
      owners: [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
        '0x3333333333333333333333333333333333333333',
      ],
      masterCopy: '0xd9Db270c1B5E3Bd161E8c8503c55cEFDDe8E6766',
      modules: [],
      fallbackHandler: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
      guard: '0x0000000000000000000000000000000000000000',
      version: '1.3.0',
    })
  }),

  // Relay endpoint for remaining relays
  http.get<{ chainId: string; safeAddress: string }, never, RelaysRemaining>(
    `${GATEWAY_URL}/v1/chains/:chainId/relay/:safeAddress`,
    () => {
      return HttpResponse.json({
        remaining: 5,
        limit: 5,
      })
    },
  ),

  // Master copies endpoint
  http.get<{ chainId: string }, never, MasterCopy[]>(`${GATEWAY_URL}/v1/chains/:chainId/about/master-copies`, () => {
    return HttpResponse.json(defaultMasterCopies)
  }),

  // Messages endpoint
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/messages`, () => {
    return HttpResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
  }),

  // Message by hash endpoint
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash`, () => {
    return HttpResponse.json({
      messageHash: '0x0',
      status: 'NEEDS_CONFIRMATION',
      message: '',
      creationTimestamp: Date.now(),
      modifiedTimestamp: Date.now(),
      confirmationsSubmitted: 0,
      confirmationsRequired: 1,
      proposedBy: {
        value: '0x0',
      },
      confirmations: [],
    })
  }),

  // Notification registration endpoints
  http.post(`${GATEWAY_URL}/v1/register/notifications`, () => {
    return HttpResponse.json({})
  }),

  http.delete(`${GATEWAY_URL}/v1/chains/:chainId/notifications/devices/:uuid`, () => {
    return HttpResponse.json({})
  }),

  http.delete(`${GATEWAY_URL}/v1/chains/:chainId/notifications/devices/:uuid/safes/:safeAddress`, () => {
    return HttpResponse.json({})
  }),
]
