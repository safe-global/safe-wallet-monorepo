import { cgwClient as api } from './cgwClient'
import type { TransactionItemPage, TransactionsGetTransactionsHistoryV1ApiArg } from './AUTO_GENERATED/transactions'

// Define types needed for infinite query
export type TxHistoryInfiniteQueryArg = Omit<TransactionsGetTransactionsHistoryV1ApiArg, 'cursor'>

// Create an infinite query endpoint for transaction history
export const txHistoryApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Infinite query version of the transaction history query
    getTxsHistoryInfinite: build.infiniteQuery<
      TransactionItemPage, // Page content type (entire page response)
      TxHistoryInfiniteQueryArg, // Query arg type (without cursor)
      string | null // Page param type (cursor)
    >({
      // Define infinite query options
      infiniteQueryOptions: {
        initialPageParam: null, // Start with null cursor

        // Function to get the next page param
        getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
          // If there's no lastPage or no next page URL, return undefined
          if (!lastPage || !lastPage.next) {
            return undefined
          }

          // Extract the cursor from the next URL
          // The URL format is something like: /v1/chains/{chainId}/safes/{safeAddress}/transactions/history?cursor=XYZ
          const nextUrl = lastPage.next
          const cursor = nextUrl.split('cursor=')[1]

          if (!cursor) {
            return undefined
          }

          return cursor
        },
      },

      // Query function
      query: ({ queryArg, pageParam }) => ({
        url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/transactions/history`,
        params: {
          timezone_offset: queryArg.timezoneOffset,
          trusted: queryArg.trusted,
          imitation: queryArg.imitation,
          timezone: queryArg.timezone,
          cursor: pageParam,
        },
      }),
    }),
  }),
})

// Export the generated hook directly
export const useGetTxsHistoryInfiniteQuery = txHistoryApi.endpoints.getTxsHistoryInfinite.useInfiniteQuery
