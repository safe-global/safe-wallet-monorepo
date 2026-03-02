export { useSafesGetSafeV1Query as useGetSafeQuery } from './AUTO_GENERATED/safes'
export {
  useTransactionsGetTransactionQueueV1Query as useGetPendingTxsQuery,
  useTransactionsGetTransactionsHistoryV1Query as useGetTxsHistoryQuery,
} from './AUTO_GENERATED/transactions'

export { useGetTxsHistoryInfiniteQuery, useGetPendingTxsInfiniteQuery } from './transactions'
export { useGetCollectiblesInfiniteQuery } from './collectibles'
export {
  useGetChainsConfigQuery,
  useGetChainsConfigV2Query,
  chainsAdapter,
  apiSliceWithChainsConfig,
  initialState as chainsInitialState,
} from './chains'
