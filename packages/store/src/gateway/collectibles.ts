import { cgwClient as api } from './cgwClient'
import type { CollectiblePage, CollectiblesGetCollectiblesV2ApiArg } from './AUTO_GENERATED/collectibles'
import { getNextPageParam } from '../utils/infiniteQuery'

// Define types needed for infinite query
export type CollectiblesInfiniteQueryArg = Omit<CollectiblesGetCollectiblesV2ApiArg, 'cursor'>

export const collectiblesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCollectiblesInfinite: build.infiniteQuery<CollectiblePage, CollectiblesInfiniteQueryArg, string | null>({
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam,
      },
      query: ({ queryArg, pageParam }) => ({
        url: `/v2/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/collectibles`,
        params: {
          trusted: queryArg.trusted,
          exclude_spam: queryArg.excludeSpam,
          cursor: pageParam,
        },
      }),
    }),
  }),
})

// Export the generated hook directly
export const useGetCollectiblesInfiniteQuery = collectiblesApi.endpoints.getCollectiblesInfinite.useInfiniteQuery
