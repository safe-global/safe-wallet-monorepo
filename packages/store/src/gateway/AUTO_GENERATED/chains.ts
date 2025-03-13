import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['chains'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      chainsGetChainsV1: build.query<ChainsGetChainsV1ApiResponse, ChainsGetChainsV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/chains`,
          params: {
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['chains'],
      }),
      chainsGetChainV1: build.query<ChainsGetChainV1ApiResponse, ChainsGetChainV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}` }),
        providesTags: ['chains'],
      }),
      chainsGetAboutChainV1: build.query<ChainsGetAboutChainV1ApiResponse, ChainsGetAboutChainV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}/about` }),
        providesTags: ['chains'],
      }),
      chainsGetBackboneV1: build.query<ChainsGetBackboneV1ApiResponse, ChainsGetBackboneV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}/about/backbone` }),
        providesTags: ['chains'],
      }),
      chainsGetMasterCopiesV1: build.query<ChainsGetMasterCopiesV1ApiResponse, ChainsGetMasterCopiesV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}/about/master-copies` }),
        providesTags: ['chains'],
      }),
      chainsGetIndexingStatusV1: build.query<ChainsGetIndexingStatusV1ApiResponse, ChainsGetIndexingStatusV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}/about/indexing` }),
        providesTags: ['chains'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type ChainsGetChainsV1ApiResponse = /** status 200  */ ChainPage
export type ChainsGetChainsV1ApiArg = {
  cursor?: string
}
export type ChainsGetChainV1ApiResponse = /** status 200  */ Chain
export type ChainsGetChainV1ApiArg = {
  chainId: string
}
export type ChainsGetAboutChainV1ApiResponse = /** status 200  */ AboutChain
export type ChainsGetAboutChainV1ApiArg = {
  chainId: string
}
export type ChainsGetBackboneV1ApiResponse = /** status 200  */ Backbone
export type ChainsGetBackboneV1ApiArg = {
  chainId: string
}
export type ChainsGetMasterCopiesV1ApiResponse = /** status 200  */ MasterCopy[]
export type ChainsGetMasterCopiesV1ApiArg = {
  chainId: string
}
export type ChainsGetIndexingStatusV1ApiResponse = /** status 200  */ IndexingStatus
export type ChainsGetIndexingStatusV1ApiArg = {
  chainId: string
}
export type NativeCurrency = {
  decimals: number
  logoUri: string
  name: string
  symbol: string
}
export type BlockExplorerUriTemplate = {
  address: string
  api: string
  txHash: string
}
export type BalancesProvider = {
  chainName?: number | null
  enabled: boolean
}
export type ContractAddresses = {
  safeSingletonAddress?: string | null
  safeProxyFactoryAddress?: string | null
  multiSendAddress?: string | null
  multiSendCallOnlyAddress?: string | null
  fallbackHandlerAddress?: string | null
  signMessageLibAddress?: string | null
  createCallAddress?: string | null
  simulateTxAccessorAddress?: string | null
  safeWebAuthnSignerFactoryAddress?: string | null
}
export type GasPriceOracle = {
  type: string
  gasParameter: string
  gweiFactor: string
  uri: string
}
export type GasPriceFixed = {
  type: string
  weiValue: string
}
export type GasPriceFixedEip1559 = {
  type: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
}
export type RpcUri = {
  authentication: 'API_KEY_PATH' | 'NO_AUTHENTICATION' | 'UNKNOWN'
  value: string
}
export type Theme = {
  backgroundColor: string
  textColor: string
}
export type Chain = {
  chainId: string
  chainName: string
  description: string
  chainLogoUri?: string | null
  l2: boolean
  isTestnet: boolean
  nativeCurrency: NativeCurrency
  transactionService: string
  blockExplorerUriTemplate: BlockExplorerUriTemplate
  beaconChainExplorerUriTemplate: object
  disabledWallets: string[]
  ensRegistryAddress?: string | null
  balancesProvider: BalancesProvider
  contractAddresses: ContractAddresses
  features: string[]
  gasPrice: (GasPriceOracle | GasPriceFixed | GasPriceFixedEip1559)[]
  publicRpcUri: RpcUri
  rpcUri: RpcUri
  safeAppsRpcUri: RpcUri
  shortName: string
  theme: Theme
  recommendedMasterCopyVersion?: string | null
}
export type ChainPage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: Chain[]
}
export type AboutChain = {
  transactionServiceBaseUri: string
  name: string
  version: string
  buildNumber: string
}
export type Backbone = {
  api_version: string
  headers?: string | null
  host: string
  name: string
  secure: boolean
  settings: object | null
  version: string
}
export type MasterCopy = {
  address: string
  version: string
}
export type IndexingStatus = {
  lastSync: number
  synced: boolean
}
export const {
  useChainsGetChainsV1Query,
  useLazyChainsGetChainsV1Query,
  useChainsGetChainV1Query,
  useLazyChainsGetChainV1Query,
  useChainsGetAboutChainV1Query,
  useLazyChainsGetAboutChainV1Query,
  useChainsGetBackboneV1Query,
  useLazyChainsGetBackboneV1Query,
  useChainsGetMasterCopiesV1Query,
  useLazyChainsGetMasterCopiesV1Query,
  useChainsGetIndexingStatusV1Query,
  useLazyChainsGetIndexingStatusV1Query,
} = injectedRtkApi
