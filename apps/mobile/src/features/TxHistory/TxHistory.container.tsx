import React from 'react'

import { useGetTxsHistoryInfiniteQuery } from '@safe-global/store/gateway'
import type { TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TxHistoryList } from '@/src/features/TxHistory/components/TxHistoryList'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useLocalSearchParams } from 'expo-router'
import Logger from '@/src/utils/logger'

export function TxHistoryContainer() {
  const activeSafe = useDefinedActiveSafe()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const { fromNotification } = useLocalSearchParams<{ fromNotification?: string }>()

  // Using the infinite query hook
  const { currentData, fetchNextPage, hasNextPage, isFetching, isLoading, isUninitialized, refetch } =
    useGetTxsHistoryInfiniteQuery({
      chainId: activeSafe.chainId,
      safeAddress: activeSafe.address,
    })

  // Force refetch when coming from push notification
  React.useEffect(() => {
    if (fromNotification) {
      Logger.info('TxHistoryContainer: Refetching data due to push notification navigation', { fromNotification })
      refetch()
    }
  }, [fromNotification, refetch])

  // Flatten all pages into a single transactions array
  const transactions = React.useMemo(() => {
    if (!currentData?.pages) {
      return []
    }

    // Combine results from all pages
    return currentData.pages.flatMap((page: TransactionItemPage) => page.results || [])
  }, [currentData?.pages])

  const onEndReached = () => {
    if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }

  // Handle pull-to-refresh - reset the data and fetch from the beginning
  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Refetch will reset the data and start fresh with page 1
      await refetch()
    } catch (error) {
      Logger.error('Error refreshing transaction history:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  // Combine loading states, but don't show loader when refreshing
  const isLoadingState = (isFetching && !isRefreshing) || isLoading || isUninitialized

  return (
    <TxHistoryList
      transactions={transactions}
      onEndReached={onEndReached}
      isLoading={isLoadingState}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
    />
  )
}
