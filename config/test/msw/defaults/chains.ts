import { http, HttpResponse } from 'msw'

const chainsConfig = {
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
}

/**
 * Default chain-config handlers served to every test via the global msw server.
 * Response bodies are the long-standing defaults; change them only with a full
 * web test-suite run, since passive consumers inherit this data implicitly.
 */
export const defaultChainHandlers = (GATEWAY_URL: string) => [
  // Chains config endpoint for RTK Query initialization (v1 - used by mobile)
  http.get(`${GATEWAY_URL}/v1/chains`, () => {
    return HttpResponse.json(chainsConfig)
  }),

  // Chains config endpoint for RTK Query initialization (v2 - used by web)
  http.get(`${GATEWAY_URL}/v2/chains`, () => {
    return HttpResponse.json(chainsConfig)
  }),

  // Individual chain endpoint
  http.get<{ chainId: string }>(`${GATEWAY_URL}/v2/chains/:chainId`, ({ params }) => {
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
]
