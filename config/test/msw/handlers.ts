import { http, HttpResponse } from 'msw'
import type { FiatCurrencies } from '@safe-global/store/gateway/types'
import { Balances } from '@safe-global/store/src/gateway/AUTO_GENERATED/balances'
import { CollectiblePage } from '@safe-global/store/src/gateway/AUTO_GENERATED/collectibles'

const iso4217Currencies = ['USD', 'EUR', 'GBP']
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
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          transactionService: 'https://safe-transaction-mainnet.safe.global',
          blockExplorerUriTemplate: {
            address: 'https://etherscan.io/address/{{address}}',
            txHash: 'https://etherscan.io/tx/{{txHash}}',
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
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
          transactionService: 'https://safe-transaction-polygon.safe.global',
          blockExplorerUriTemplate: {
            address: 'https://polygonscan.com/address/{{address}}',
            txHash: 'https://polygonscan.com/tx/{{txHash}}',
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
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          transactionService: 'https://safe-transaction-arbitrum.safe.global',
          blockExplorerUriTemplate: {
            address: 'https://arbiscan.io/address/{{address}}',
            txHash: 'https://arbiscan.io/tx/{{txHash}}',
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
]
