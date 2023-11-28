import isEqual from 'lodash/isEqual'
import { useMemo } from 'react'
import { getTransactionHistory, type TransactionListPage } from '@safe-global/safe-gateway-typescript-sdk'
import { useAppSelector } from '@/store'
import useAsync from './useAsync'
import { selectTxHistory } from '@/store/txHistorySlice'
import useSafeInfo from './useSafeInfo'
import { fetchFilteredTxHistory, useTxFilter } from '@/utils/tx-history-filter'

const useTxHistory = (
  pageUrl?: string,
): {
  page?: TransactionListPage
  error?: string
  loading: boolean
} => {
  // The latest page of the history is always in the store
  const historyState = useAppSelector(selectTxHistory, isEqual)
  const [filter] = useTxFilter()

  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()

  // If filter exists or pageUrl is passed, load a new history page from the API
  const [page, error, loading] = useAsync<TransactionListPage>(
    () => {
      if (!(filter || pageUrl)) return

      return filter
        ? fetchFilteredTxHistory(chainId, safeAddress, filter, pageUrl)
        : getTransactionHistory(chainId, safeAddress, pageUrl)
    },
    [chainId, safeAddress, pageUrl, filter],
    false,
  )

  const isFetched = filter || pageUrl
  const dataPage = isFetched ? page : historyState.data
  const errorMessage = isFetched ? error?.message : historyState.error
  const isLoading = isFetched ? loading : historyState.loading

  // Return the new page or the stored page
  return useMemo(
    () => ({
      page: dataPage,
      error: errorMessage,
      loading: isLoading,
    }),
    [dataPage, errorMessage, isLoading],
  )
}

export default useTxHistory
