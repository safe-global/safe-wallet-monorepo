import { useMemo } from 'react'
import { type TransactionListPage } from '@safe-global/safe-gateway-typescript-sdk'
import { useAppSelector } from '@/store'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { selectTxHistory } from '@/store/txHistorySlice'
import useSafeInfo from './useSafeInfo'
import { fetchFilteredTxHistory, useTxFilter } from '@/utils/tx-history-filter'
import { getTxHistory } from '@/services/transactions'
import { selectSettings } from '@/store/settingsSlice'
import { useHasFeature } from './useChains'

import { FEATURES } from '@safe-global/utils/utils/chains'

const useTxHistory = (
  pageUrl?: string,
): {
  page?: TransactionListPage
  error?: string
  loading: boolean
} => {
  // The latest page of the history is always in the store
  const historyState = useAppSelector(selectTxHistory)
  const [filter] = useTxFilter()
  const { hideSuspiciousTransactions } = useAppSelector(selectSettings)
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const hideUntrustedTxs = (hasDefaultTokenlist && hideSuspiciousTransactions) ?? true
  const hideImitationTxs = hideSuspiciousTransactions ?? true

  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()

  // If filter exists or pageUrl is passed, load a new history page from the API
  const [page, error, loading] = useAsync<TransactionListPage>(
    () => {
      if (!(filter || pageUrl)) return

      return filter
        ? fetchFilteredTxHistory(chainId, safeAddress, filter, hideUntrustedTxs, hideImitationTxs, pageUrl)
        : getTxHistory(chainId, safeAddress, hideUntrustedTxs, hideImitationTxs, pageUrl)
    },
    [filter, pageUrl, chainId, safeAddress, hideUntrustedTxs, hideImitationTxs],
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
