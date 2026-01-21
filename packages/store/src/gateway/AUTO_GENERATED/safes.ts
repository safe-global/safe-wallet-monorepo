import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['safes'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      safesGetSafeV1: build.query<SafesGetSafeV1ApiResponse, SafesGetSafeV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}` }),
        providesTags: ['safes'],
      }),
      safesGetNoncesV1: build.query<SafesGetNoncesV1ApiResponse, SafesGetNoncesV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/nonces` }),
        providesTags: ['safes'],
      }),
      safesGetSafeOverviewV1: build.query<SafesGetSafeOverviewV1ApiResponse, SafesGetSafeOverviewV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/safes`,
          params: {
            currency: queryArg.currency,
            safes: queryArg.safes,
            trusted: queryArg.trusted,
            exclude_spam: queryArg.excludeSpam,
            wallet_address: queryArg.walletAddress,
          },
        }),
        providesTags: ['safes'],
      }),
      safesGetSafeOverviewV2: build.query<SafesGetSafeOverviewV2ApiResponse, SafesGetSafeOverviewV2ApiArg>({
        query: (queryArg) => ({
          url: `/v2/safes`,
          params: {
            currency: queryArg.currency,
            safes: queryArg.safes,
            trusted: queryArg.trusted,
            exclude_spam: queryArg.excludeSpam,
            wallet_address: queryArg.walletAddress,
          },
        }),
        providesTags: ['safes'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type SafesGetSafeV1ApiResponse = /** status 200 Safe information retrieved successfully */ SafeState
export type SafesGetSafeV1ApiArg = {
  /** Chain ID where the Safe is deployed */
  chainId: string
  /** Safe contract address (0x prefixed hex string) */
  safeAddress: string
}
export type SafesGetNoncesV1ApiResponse = /** status 200 Safe nonces retrieved successfully */ SafeNonces
export type SafesGetNoncesV1ApiArg = {
  /** Chain ID where the Safe is deployed */
  chainId: string
  /** Safe contract address (0x prefixed hex string) */
  safeAddress: string
}
export type SafesGetSafeOverviewV1ApiResponse =
  /** status 200 Array of Safe overviews with balances and metadata */ SafeOverview[]
export type SafesGetSafeOverviewV1ApiArg = {
  /** Fiat currency code for balance conversion (e.g., USD, EUR) */
  currency: string
  /** Comma-separated list of Safe addresses in CAIP-10 format (chainId:address) */
  safes: string
  /** If true, only includes trusted tokens in balance calculations */
  trusted?: boolean
  /** If true, excludes spam tokens from balance calculations */
  excludeSpam?: boolean
  /** Optional wallet address to filter Safes where this address is an owner */
  walletAddress?: string
}
export type SafesGetSafeOverviewV2ApiResponse =
  /** status 200 Array of Safe overviews with balances and metadata */ SafeOverview[]
export type SafesGetSafeOverviewV2ApiArg = {
  /** Fiat currency code for balance conversion (e.g., USD, EUR) */
  currency: string
  /** Comma-separated list of Safe addresses in CAIP-10 format (chainId:address) */
  safes: string
  /** If true, only includes trusted tokens in balance calculations */
  trusted?: boolean
  /** If true, excludes spam tokens from balance calculations */
  excludeSpam?: boolean
  /** Optional wallet address to filter Safes where this address is an owner */
  walletAddress?: string
}
export type AddressInfo = {
  value: string
  name?: string | null
  logoUri?: string | null
}
export type SafeState = {
  address: AddressInfo
  chainId: string
  nonce: number
  threshold: number
  owners: AddressInfo[]
  implementation: AddressInfo
  modules?: AddressInfo[] | null
  fallbackHandler?: AddressInfo | null
  guard?: AddressInfo | null
  version?: string | null
  implementationVersionState: 'UP_TO_DATE' | 'OUTDATED' | 'UNKNOWN'
  collectiblesTag?: string | null
  txQueuedTag?: string | null
  txHistoryTag?: string | null
  messagesTag?: string | null
}
export type SafeNonces = {
  currentNonce: number
  recommendedNonce: number
}
export type SafeOverview = {
  address: AddressInfo
  chainId: string
  threshold: number
  owners: AddressInfo[]
  fiatTotal: string
  queued: number
  awaitingConfirmation?: number | null
}
export const {
  useSafesGetSafeV1Query,
  useLazySafesGetSafeV1Query,
  useSafesGetNoncesV1Query,
  useLazySafesGetNoncesV1Query,
  useSafesGetSafeOverviewV1Query,
  useLazySafesGetSafeOverviewV1Query,
  useSafesGetSafeOverviewV2Query,
  useLazySafesGetSafeOverviewV2Query,
} = injectedRtkApi
