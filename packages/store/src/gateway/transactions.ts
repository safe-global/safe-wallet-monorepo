import { cgwClient as api } from './cgwClient'
import type {
  TransactionItemPage,
  TransactionsGetTransactionsHistoryV1ApiArg,
  QueuedItemPage,
  TransactionsGetTransactionQueueV1ApiArg,
} from './AUTO_GENERATED/transactions'
import { getNextPageParam } from '../utils/infiniteQuery'

// Define types needed for infinite query
export type TxHistoryInfiniteQueryArg = Omit<TransactionsGetTransactionsHistoryV1ApiArg, 'cursor'>
export type PendingTxsInfiniteQueryArg = Omit<TransactionsGetTransactionQueueV1ApiArg, 'cursor'>

export const txHistoryApi = api.injectEndpoints({
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
  }),
})

export const useGetTxsHistoryInfiniteQuery = txHistoryApi.endpoints.getTxsHistoryInfinite.useInfiniteQuery
export const useGetPendingTxsInfiniteQuery = txHistoryApi.endpoints.getPendingTxsInfinite.useInfiniteQuery
