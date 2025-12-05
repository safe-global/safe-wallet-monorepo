import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

export interface MockChainOptions {
  chainId?: string
  chainName?: string
  shortName?: string
  l2?: boolean
  isTestnet?: boolean
  nativeCurrency?: Partial<Chain['nativeCurrency']>
  rpcUri?: string
}

export const createMockChain = (options: MockChainOptions = {}): Chain => {
  const chainId = options.chainId ?? '1'
  const chainName = options.chainName ?? 'Ethereum'
  const shortName = options.shortName ?? 'eth'
  const rpcUri = options.rpcUri ?? 'https://eth.llamarpc.com'

  return {
    chainId,
    chainName,
    shortName,
    description: `${chainName} Mainnet`,
    l2: options.l2 ?? false,
    isTestnet: options.isTestnet ?? false,
    zk: false,
    nativeCurrency: {
      name: options.nativeCurrency?.name ?? 'Ether',
      symbol: options.nativeCurrency?.symbol ?? 'ETH',
      decimals: options.nativeCurrency?.decimals ?? 18,
      logoUri: options.nativeCurrency?.logoUri ?? '',
    },
    blockExplorerUriTemplate: {
      address: `https://etherscan.io/address/{{address}}`,
      txHash: `https://etherscan.io/tx/{{txHash}}`,
      api: 'https://api.etherscan.io/api?module={{module}}&action={{action}}&address={{address}}&apiKey={{apiKey}}',
    },
    transactionService: `https://safe-transaction-${shortName}.safe.global`,
    chainLogoUri: '',
    theme: {
      textColor: '#001428',
      backgroundColor: '#E8E7E6',
    },
    rpcUri: {
      authentication: 'NO_AUTHENTICATION',
      value: rpcUri,
    },
    safeAppsRpcUri: {
      authentication: 'NO_AUTHENTICATION',
      value: rpcUri,
    },
    publicRpcUri: {
      authentication: 'NO_AUTHENTICATION',
      value: rpcUri,
    },
    features: [],
    gasPrice: [],
    ensRegistryAddress: '',
    disabledWallets: [],
    contractAddresses: {},
    balancesProvider: {
      chainName: shortName,
      enabled: true,
    },
    beaconChainExplorerUriTemplate: {
      address: '',
      api: '',
    },
  } as Chain
}

export const ETHEREUM_CHAIN = createMockChain()

export const POLYGON_CHAIN = createMockChain({
  chainId: '137',
  chainName: 'Polygon',
  shortName: 'matic',
  l2: true,
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUri: 'https://polygon-rpc.com',
})

export const ARBITRUM_CHAIN = createMockChain({
  chainId: '42161',
  chainName: 'Arbitrum One',
  shortName: 'arb1',
  l2: true,
  rpcUri: 'https://arbitrum-one.publicnode.com',
})
