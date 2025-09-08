export { useSafesGetSafeV1Query as useGetSafeQuery } from './AUTO_GENERATED/safes'
export {
  useTransactionsGetTransactionQueueV1Query as useGetPendingTxsQuery,
  useTransactionsGetTransactionsHistoryV1Query as useGetTxsHistoryQuery,
} from './AUTO_GENERATED/transactions'
export { useChainsGetIndexingStatusV1Query as useGetIndexingStatusQuery } from './AUTO_GENERATED/chains'

export { useGetTxsHistoryInfiniteQuery, useGetPendingTxsInfiniteQuery } from './transactions'
export { useGetCollectiblesInfiniteQuery } from './collectibles'
