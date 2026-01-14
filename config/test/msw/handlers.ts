import { http, HttpResponse } from 'msw'
import type { FiatCurrencies } from '@safe-global/store/gateway/types'
import { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { CollectiblePage } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import type { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import type { MasterCopy } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { TransactionDetails, QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { defaultMockSafeApps } from './mockSafeApps'

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

export const handlers = (GATEWAY_URL: string) => [
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

  // Chains config endpoint for RTK Query initialization
  http.get(`${GATEWAY_URL}/v1/chains`, () => {
    return HttpResponse.json({
      count: 3,
      next: null,
      previous: null,
      results: [
        {
          chainId: '1',
          chainName: 'Ethereum',
          shortName: 'eth',
          description: 'Ethereum Mainnet',
          l2: false,
          isTestnet: false,
          zk: false,
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: '' },
          transactionService: 'https://safe-transaction-mainnet.safe.global',
          blockExplorerUriTemplate: {
            address: 'https://etherscan.io/address/{{address}}',
            txHash: 'https://etherscan.io/tx/{{txHash}}',
            api: 'https://api.etherscan.io/api',
          },
          beaconChainExplorerUriTemplate: {},
          disabledWallets: [],
          balancesProvider: { chainName: 'ethereum', enabled: true },
          contractAddresses: { safeSingletonAddress: '0x', safeProxyFactoryAddress: '0x' },
          features: [],
          gasPrice: [],
          publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://ethereum.publicnode.com' },
          rpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://ethereum.publicnode.com' },
          safeAppsRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://ethereum.publicnode.com' },
          theme: { backgroundColor: '#E8E7E6', textColor: '#001428' },
        },
        {
          chainId: '137',
          chainName: 'Polygon',
          shortName: 'matic',
          description: 'Polygon Mainnet',
          l2: true,
          isTestnet: false,
          zk: false,
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18, logoUri: '' },
          transactionService: 'https://safe-transaction-polygon.safe.global',
          blockExplorerUriTemplate: {
            address: 'https://polygonscan.com/address/{{address}}',
            txHash: 'https://polygonscan.com/tx/{{txHash}}',
            api: 'https://api.polygonscan.com/api',
          },
          beaconChainExplorerUriTemplate: {},
          disabledWallets: [],
          balancesProvider: { chainName: 'polygon', enabled: true },
          contractAddresses: { safeSingletonAddress: '0x', safeProxyFactoryAddress: '0x' },
          features: [],
          gasPrice: [],
          publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://polygon-rpc.com' },
          rpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://polygon-rpc.com' },
          safeAppsRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://polygon-rpc.com' },
          theme: { backgroundColor: '#8B5CF6', textColor: '#FFFFFF' },
        },
        {
          chainId: '42161',
          chainName: 'Arbitrum One',
          shortName: 'arb1',
          description: 'Arbitrum One',
          l2: true,
          isTestnet: false,
          zk: false,
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: '' },
          transactionService: 'https://safe-transaction-arbitrum.safe.global',
          blockExplorerUriTemplate: {
            address: 'https://arbiscan.io/address/{{address}}',
            txHash: 'https://arbiscan.io/tx/{{txHash}}',
            api: 'https://api.arbiscan.io/api',
          },
          beaconChainExplorerUriTemplate: {},
          disabledWallets: [],
          balancesProvider: { chainName: 'arbitrum', enabled: true },
          contractAddresses: { safeSingletonAddress: '0x', safeProxyFactoryAddress: '0x' },
          features: [],
          gasPrice: [],
          publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://arbitrum-one.publicnode.com' },
          rpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://arbitrum-one.publicnode.com' },
          safeAppsRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://arbitrum-one.publicnode.com' },
          theme: { backgroundColor: '#12AAFF', textColor: '#FFFFFF' },
        },
      ],
    })
  }),

  // Individual chain endpoint
  http.get<{ chainId: string }>(`${GATEWAY_URL}/v1/chains/:chainId`, ({ params }) => {
    const { chainId } = params

    // Mock data for common chains
    const chainMocks: Record<string, any> = {
      '1': {
        chainId: '1',
        chainName: 'Ethereum',
        shortName: 'eth',
        description: 'Ethereum Mainnet',
        l2: false,
        isTestnet: false,
        zk: false,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: '' },
        transactionService: 'https://safe-transaction-mainnet.safe.global',
        blockExplorerUriTemplate: {
          address: 'https://etherscan.io/address/{{address}}',
          txHash: 'https://etherscan.io/tx/{{txHash}}',
          api: 'https://api.etherscan.io/api',
        },
        beaconChainExplorerUriTemplate: {},
        disabledWallets: [],
        balancesProvider: { chainName: 1, enabled: true },
        contractAddresses: { safeSingletonAddress: '0x', safeProxyFactoryAddress: '0x' },
        features: [],
        gasPrice: [],
        publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://ethereum.publicnode.com' },
        rpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://ethereum.publicnode.com' },
        safeAppsRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://ethereum.publicnode.com' },
        theme: { backgroundColor: '#E8E7E6', textColor: '#001428' },
      },
      '137': {
        chainId: '137',
        chainName: 'Polygon',
        shortName: 'matic',
        description: 'Polygon Mainnet',
        l2: true,
        isTestnet: false,
        zk: false,
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18, logoUri: '' },
        transactionService: 'https://safe-transaction-polygon.safe.global',
        blockExplorerUriTemplate: {
          address: 'https://polygonscan.com/address/{{address}}',
          txHash: 'https://polygonscan.com/tx/{{txHash}}',
          api: 'https://api.polygonscan.com/api',
        },
        beaconChainExplorerUriTemplate: {},
        disabledWallets: [],
        balancesProvider: { chainName: 137, enabled: true },
        contractAddresses: { safeSingletonAddress: '0x', safeProxyFactoryAddress: '0x' },
        features: [],
        gasPrice: [],
        publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://polygon-rpc.com' },
        rpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://polygon-rpc.com' },
        safeAppsRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://polygon-rpc.com' },
        theme: { backgroundColor: '#8B5CF6', textColor: '#FFFFFF' },
      },
    }

    const chain = chainMocks[chainId]
    if (chain) {
      return HttpResponse.json(chain)
    }

    // Return 404 for unknown chains
    return new HttpResponse(null, { status: 404 })
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

  // Mock targeted-messaging endpoint for Hypernative (outreachId: 11)
  http.get<{ outreachId: string; chainId: string; safeAddress: string }>(
    `${GATEWAY_URL}/v1/targeted-messaging/outreaches/:outreachId/chains/:chainId/safes/:safeAddress`,
    ({ params }) => {
      const { outreachId, chainId, safeAddress } = params

      // List of Safe addresses that should be considered "targeted" for Hypernative
      // Add your test Safe addresses here (use lowercase for comparison)
      const targetedSafes = [
        '0x1234567890123456789012345678901234567890',
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
        '0x8f02c3d4a63b2fe436762c807eff182d35df721f',
      ]

      const isTargeted = targetedSafes.some((addr) => addr.toLowerCase() === safeAddress.toLowerCase())

      if (isTargeted && outreachId === '11') {
        return HttpResponse.json({
          outreachId: Number(outreachId),
          address: safeAddress,
        })
      }

      // Return 404 for non-targeted Safes (matches backend behavior)
      return HttpResponse.json({ detail: 'Not found' }, { status: 404 })
    },
  ),

  // Mock Hypernative OAuth token exchange endpoint
  // This handles the OAuth authorization code exchange for access tokens
  // Used in development and testing when NEXT_PUBLIC_HYPERNATIVE_TOKEN_URL is set to mock URL
  // Per Hypernative API spec: accepts JSON body, returns 600s expiry, read-only scope
  http.post('https://mock-hn-auth.example.com/oauth/token', async ({ request }) => {
    const body = (await request.json()) as {
      grant_type?: string
      code?: string
      code_verifier?: string
      redirect_uri?: string
      client_id?: string
    }

    const grantType = body?.grant_type
    const code = body?.code
    const codeVerifier = body?.code_verifier
    const redirectUri = body?.redirect_uri
    const clientId = body?.client_id

    // Validate required OAuth parameters
    if (!grantType || grantType !== 'authorization_code') {
      return HttpResponse.json({ error: 'invalid_grant', error_description: 'Invalid grant type' }, { status: 400 })
    }

    if (!code) {
      return HttpResponse.json({ error: 'invalid_request', error_description: 'Missing code' }, { status: 400 })
    }

    if (!codeVerifier) {
      return HttpResponse.json(
        { error: 'invalid_request', error_description: 'Missing PKCE code_verifier' },
        { status: 400 },
      )
    }

    if (!redirectUri) {
      return HttpResponse.json({ error: 'invalid_request', error_description: 'Missing redirect_uri' }, { status: 400 })
    }

    if (!clientId || clientId !== 'SAFE_WALLET_WEB') {
      return HttpResponse.json({ error: 'invalid_client', error_description: 'Invalid client_id' }, { status: 401 })
    }

    // Return successful token response per Hypernative spec
    // Hypernative API wraps the OAuth token response in a `data` object
    return HttpResponse.json({
      data: {
        access_token: `mock-hn-token-${Date.now()}`,
        token_type: 'Bearer',
        expires_in: 600,
        scope: 'read',
      },
    })
  }),
]
