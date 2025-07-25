import React from 'react'

import { useGetTxsHistoryInfiniteQuery } from '@safe-global/store/gateway'
import { txHistoryApi } from '@safe-global/store/gateway/transactions'
import type { TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TxHistoryList } from '@/src/features/TxHistory/components/TxHistoryList'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppDispatch } from '@/src/store/hooks'
import { useLocalSearchParams } from 'expo-router'
import Logger from '@/src/utils/logger'

export function TxHistoryContainer() {
  const activeSafe = useDefinedActiveSafe()
  const dispatch = useAppDispatch()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const { fromNotification } = useLocalSearchParams<{ fromNotification?: string }>()

  const queryArgs = {
    chainId: activeSafe.chainId,
    safeAddress: activeSafe.address,
  }

  const {
    currentData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isUninitialized,
    refetch,
  } = useGetTxsHistoryInfiniteQuery(queryArgs)

  // Force refetch when coming from push notification
  React.useEffect(() => {
    if (fromNotification) {
      Logger.info('TxHistoryContainer: Refetching data due to push notification navigation', { fromNotification })
      refetch()
    }
  }, [fromNotification, refetch])

  const transactions = React.useMemo(() => {
    if (!currentData?.pages) {
      return []
    }

    const allTransactions = currentData.pages.flatMap((page: TransactionItemPage) => page.results || [])
    return allTransactions
  }, [currentData?.pages])

  const onEndReached = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetching) {
      Logger.info('TxHistoryContainer: Loading next page of transactions')
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, isFetching, fetchNextPage])

  // Handle pull-to-refresh - reset the infinite query cache to only first page
  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      Logger.info('TxHistoryContainer: Resetting infinite query cache and refetching first page')

      // Reset the infinite query cache but keep the first page to avoid blank screen
      // This removes additional pages while preserving the initial page during refresh
      dispatch(
        txHistoryApi.util.updateQueryData('getTxsHistoryInfinite', queryArgs, (draft) => {
          // Keep only the first page and first page param to avoid blank screen
          if (draft.pages && draft.pages.length > 1) {
            draft.pages = draft.pages.slice(0, 1)
            draft.pageParams = draft.pageParams?.slice(0, 1) || [null]
          }
        }),
      )

      // Refetch will now start fresh with only page 1
      await refetch()
    } catch (error) {
      Logger.error('Error refreshing transaction history:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [dispatch, refetch])

  // Combine loading states, but don't show loader when refreshing
  const isLoadingState = React.useMemo(() => {
    return (isFetching && !isRefreshing) || isLoading || isUninitialized
  }, [isFetching, isRefreshing, isLoading, isUninitialized])

  return (
    <TxHistoryList
      transactions={transactions}
      onEndReached={onEndReached}
      isLoading={isLoadingState}
      isLoadingNext={isFetchingNextPage}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
    />
  )
}
