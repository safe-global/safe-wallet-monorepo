import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['collectibles'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      collectiblesGetCollectiblesV2: build.query<
        CollectiblesGetCollectiblesV2ApiResponse,
        CollectiblesGetCollectiblesV2ApiArg
      >({
        query: (queryArg) => ({
          url: `/v2/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/collectibles`,
          params: {
            trusted: queryArg.trusted,
            exclude_spam: queryArg.excludeSpam,
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['collectibles'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type CollectiblesGetCollectiblesV2ApiResponse = /** status 200  */ CollectiblePage
export type CollectiblesGetCollectiblesV2ApiArg = {
  chainId: string
  safeAddress: string
  trusted?: boolean
  excludeSpam?: boolean
  cursor?: string
}
export type Collectible = {
  address: string
  tokenName: string
  tokenSymbol: string
  logoUri: string
  id: string
  uri?: string | null
  name?: string | null
  description?: string | null
  imageUri?: string | null
  metadata?: object | null
}
export type CollectiblePage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: Collectible[]
}
export const { useCollectiblesGetCollectiblesV2Query, useLazyCollectiblesGetCollectiblesV2Query } = injectedRtkApi
