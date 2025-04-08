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

          // Extract the cursor from the next URL using URLSearchParams
          // This is more robust than using string.split when dealing with complex URLs
          try {
            // The URL might be a relative URL like /v1/chains/{chainId}/safes/{safeAddress}/transactions/history?cursor=XYZ&other=param
            // or a full URL with hostname
            const urlParts = lastPage.next.split('?')
            if (urlParts.length < 2) {
              return undefined // No query string in the URL
            }

            const queryString = urlParts[1]
            const searchParams = new URLSearchParams(queryString)
            const cursor = searchParams.get('cursor')

            if (!cursor) {
              return undefined
            }

            return cursor
          } catch (error) {
            console.error('Error extracting cursor from next URL:', error)
            return undefined
          }
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
