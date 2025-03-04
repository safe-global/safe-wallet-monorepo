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
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type SafesGetSafeV1ApiResponse = /** status 200  */ SafeState
export type SafesGetSafeV1ApiArg = {
  chainId: string
  safeAddress: string
}
export type SafesGetNoncesV1ApiResponse = /** status 200  */ SafeNonces
export type SafesGetNoncesV1ApiArg = {
  chainId: string
  safeAddress: string
}
export type SafesGetSafeOverviewV1ApiResponse = /** status 200  */ SafeOverview[]
export type SafesGetSafeOverviewV1ApiArg = {
  currency: string
  safes: string
  trusted?: boolean
  excludeSpam?: boolean
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
} = injectedRtkApi
