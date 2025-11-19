import type { TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTransactionsGetTransactionsHistoryV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from './useSafeInfo'
import { fetchFilteredTxHistory, useTxFilter } from '@/utils/tx-history-filter'
import { getTxHistory } from '@/services/transactions'
import { selectSettings } from '@/store/settingsSlice'
import { useHasFeature } from './useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { POLLING_INTERVAL } from '@/config/constants'
import { getRtkQueryErrorMessage } from '@/utils/rtkQueryError'

const useTxHistory = (
  pageUrl?: string,
): {
  page?: TransactionItemPage
  error?: string
  loading: boolean
} => {
  const [filter] = useTxFilter()
  const { hideSuspiciousTransactions } = useAppSelector(selectSettings)
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const hideUntrustedTxs = (hasDefaultTokenlist && hideSuspiciousTransactions) ?? true
  const hideImitationTxs = hideSuspiciousTransactions ?? true

  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()

  // The latest page of the history is fetched via RTK Query
  const {
    currentData: historyData,
    error: historyError,
    isLoading: historyLoading,
  } = useTransactionsGetTransactionsHistoryV1Query(
    {
      chainId,
      safeAddress,
      trusted: !hideUntrustedTxs,
      imitation: !hideImitationTxs,
    },
    {
      skip: !safeAddress || !chainId || !!(filter || pageUrl),
      pollingInterval: POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    },
  )

  // If filter exists or pageUrl is passed, load a new history page from the API
  const [page, error, loading] = useAsync<TransactionItemPage>(
    () => {
      if (!(filter || pageUrl)) return

      return (
        filter
          ? fetchFilteredTxHistory(chainId, safeAddress, filter, hideUntrustedTxs, hideImitationTxs, pageUrl)
          : getTxHistory(chainId, safeAddress, hideUntrustedTxs, hideImitationTxs, pageUrl)
      ) as Promise<TransactionItemPage>
    },
    [filter, pageUrl, chainId, safeAddress, hideUntrustedTxs, hideImitationTxs],
    false,
  )

  const isFetched = filter || pageUrl
  const dataPage = isFetched ? page : historyData
  const errorMessage = isFetched ? error?.message : getRtkQueryErrorMessage(historyError, 'Failed to load history')
  const isLoading = isFetched ? loading : historyLoading

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
