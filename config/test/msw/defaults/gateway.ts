import { http, HttpResponse } from 'msw'
import type { FiatCurrencies } from '@safe-global/store/gateway/types'
import { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { CollectiblePage } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import type { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import type { MasterCopy } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { TransactionDetails, QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { defaultMockSafeApps } from '../mockSafeApps'

const iso4217Currencies = ['USD', 'EUR', 'GBP']

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
 * Default gateway handlers served to every test via the global msw server.
 * Response bodies are the long-standing defaults; change them only with a full
 * web test-suite run, since passive consumers inherit this data implicitly.
 */
export const defaultGatewayHandlers = (GATEWAY_URL: string) => [
  http.get(`${GATEWAY_URL}/v1/auth/nonce`, () => {
    return HttpResponse.json({
      nonce: 'mock-nonce-for-testing-12345',
      timestamp: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 300000).toISOString(),
    })
  }),

  http.get<never, never, Balances>(`${GATEWAY_URL}/v1/chains/1/safes/0x123/balances/USD`, () => {
    return HttpResponse.json({
      items: [
        {
          tokenInfo: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
            address: '0x',
            type: 'ERC20',
            logoUri: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
          },
          balance: '1000000000000000000',
          fiatBalance: '2000',
          fiatConversion: '2000',
        },
      ],
      fiatTotal: '2000',
    })
  }),
  http.get<never, never, CollectiblePage>(`${GATEWAY_URL}/v2/chains/:chainId/safes/:safeAddress/collectibles`, () => {
    return HttpResponse.json({
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          id: '1',
          address: '0x123',
          tokenName: 'Cool NFT',
          tokenSymbol: 'CNFT',
          logoUri: 'https://example.com/nft1.png',
          name: 'NFT #1',
          description: 'A cool NFT',
          uri: 'https://example.com/nft1.json',
          imageUri: 'https://example.com/nft1.png',
        },
        {
          id: '2',
          address: '0x456',
          tokenName: 'Another NFT',
          tokenSymbol: 'ANFT',
          logoUri: 'https://example.com/nft2.png',
          name: 'NFT #2',
          description: 'Another cool NFT',
          uri: 'https://example.com/nft2.json',
          imageUri: 'https://example.com/nft2.png',
        },
      ],
    })
  }),
  http.get<never, never, FiatCurrencies>(`${GATEWAY_URL}/v1/balances/supported-fiat-codes`, () => {
    return HttpResponse.json(iso4217Currencies)
  }),

  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, () => {
    return HttpResponse.json({
      address: '0x123',
      nonce: 0,
      threshold: 1,
      owners: ['0x1234567890123456789012345678901234567890'],
      masterCopy: '0x',
      modules: [],
      fallbackHandler: '0x',
      guard: '0x',
      version: '1.3.0',
    })
  }),

  // Relay endpoint for remaining relays
  http.get<{ chainId: string; safeAddress: string }, never, RelaysRemaining>(
    `${GATEWAY_URL}/v1/chains/:chainId/relay/:safeAddress`,
    ({ params }) => {
      // Default mock response; can be customized per test using MSW request handlers
      return HttpResponse.json({
        remaining: 5,
        limit: 5,
      })
    },
  ),

  // Master copies endpoint for master copy contracts
  http.get<{ chainId: string }, never, MasterCopy[]>(`${GATEWAY_URL}/v1/chains/:chainId/about/master-copies`, () => {
    return HttpResponse.json(defaultMasterCopies)
  }),

  // Safe Apps endpoint
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safe-apps`, ({ request }) => {
    const url = new URL(request.url)
    const appUrl = url.searchParams.get('url')

    // If filtering by URL, return matching apps (with trailing slash handling)
    if (appUrl) {
      const matchingApp = defaultMockSafeApps.find(
        (app) => app.url === appUrl || app.url === appUrl.replace(/\/$/, '') || `${app.url}/` === appUrl,
      )
      return HttpResponse.json(matchingApp ? [matchingApp] : [])
    }

    // Return all apps by default
    return HttpResponse.json(defaultMockSafeApps)
  }),

  // Transaction endpoint for retrieving transaction details
  http.get<{ chainId: string; id: string }, never, TransactionDetails>(
    `${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`,
    () => {
      // Default mock response; can be customized per test using MSW request handlers
      return HttpResponse.json({
        txInfo: {
          type: 'Custom',
          to: {
            value: '0x123',
            name: 'Test',
            logoUri: null,
          },
          dataSize: '100',
          value: null,
          isCancellation: false,
          methodName: 'test',
        },
        safeAddress: '0x456',
        txId: '0x345',
        txStatus: 'AWAITING_CONFIRMATIONS' as const,
      })
    },
  ),

  // Messages endpoint for retrieving safe messages
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

  // Transaction queue endpoint for paginated transaction queue
  http.get<{ chainId: string; safeAddress: string }, never, QueuedItemPage>(
    `${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`,
    () => {
      return HttpResponse.json({
        count: 2,
        next: null,
        previous: null,
        results: [],
      })
    },
  ),

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

  // Transaction confirmation endpoint for signing
  http.post<{ chainId: string; safeTxHash: string }, { signature: string }>(
    `${GATEWAY_URL}/v1/chains/:chainId/transactions/:safeTxHash/confirmations`,
    async ({ request }) => {
      const body = await request.json()
      // Success case - echo back the signature
      return HttpResponse.json({ signature: body.signature }, { status: 201 })
    },
  ),
]
