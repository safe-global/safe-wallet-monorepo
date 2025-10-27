import { cgwClient as api } from './cgwClient'
import type {
  TransactionItemPage,
  TransactionsGetTransactionsHistoryV1ApiArg,
  QueuedItemPage,
  TransactionsGetTransactionQueueV1ApiArg,
  TransactionDetails,
} from './AUTO_GENERATED/transactions'
import { addTagTypes } from './AUTO_GENERATED/transactions'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { getNextPageParam } from '../utils/infiniteQuery'

// Define types needed for infinite query
export type TxHistoryInfiniteQueryArg = Omit<TransactionsGetTransactionsHistoryV1ApiArg, 'cursor'>
export type PendingTxsInfiniteQueryArg = Omit<TransactionsGetTransactionQueueV1ApiArg, 'cursor'>

export const txHistoryApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      getTxsHistoryInfinite: build.infiniteQuery<TransactionItemPage, TxHistoryInfiniteQueryArg, string | null>({
        infiniteQueryOptions: {
          initialPageParam: null,
          getNextPageParam,
          // TODO: Add maxPages and getPreviousPageParam for bidirectional infinite query that is memory efficient
        },

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

      getPendingTxsInfinite: build.infiniteQuery<QueuedItemPage, PendingTxsInfiniteQueryArg, string | null>({
        infiniteQueryOptions: {
          initialPageParam: null,
          getNextPageParam,
        },
        query: ({ queryArg, pageParam }) => ({
          url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/transactions/queued`,
          params: {
            trusted: queryArg.trusted,
            cursor: pageParam,
          },
        }),
      }),

      transactionsGetMultipleTransactionDetails: build.query<
        TransactionDetails[],
        { chainId: string; txIds: string[] }
      >({
        async queryFn(args, _api, _extraOptions, fetchWithBaseQuery) {
          const { chainId, txIds } = args

          const results = await Promise.all(
            txIds.map(async (id) => {
              const result = await fetchWithBaseQuery({
                url: `/v1/chains/${chainId}/transactions/${id}`,
              })

              if (result.error) {
                return {
                  error: result.error,
                }
              }

              return { data: result.data as TransactionDetails }
            }),
          )

          // Check if any request failed
          const firstError = results.find((r) => 'error' in r && r.error)
          if (firstError && 'error' in firstError && firstError.error) {
            return { error: firstError.error }
          }

          // Extract all data
          const data = results.map((r) => ('data' in r ? r.data : null)).filter(Boolean) as TransactionDetails[]

          return { data }
        },
        providesTags: ['transactions'],
      }),
    }),
    overrideExisting: true,
  })

export const useGetTxsHistoryInfiniteQuery = txHistoryApi.endpoints.getTxsHistoryInfinite.useInfiniteQuery
export const useGetPendingTxsInfiniteQuery = txHistoryApi.endpoints.getPendingTxsInfinite.useInfiniteQuery
export const {
  useTransactionsGetMultipleTransactionDetailsQuery,
  useLazyTransactionsGetMultipleTransactionDetailsQuery,
} = txHistoryApi
