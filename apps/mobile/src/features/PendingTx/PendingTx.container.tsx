import React from 'react'
import { PendingTxListContainer } from '@/src/features/PendingTx/components/PendingTxList'
import usePendingTxs from '@/src/hooks/usePendingTxs'
import Logger from '@/src/utils/logger'
import BadgeManager from '@/src/services/notifications/BadgeManager'

export function PendingTxContainer() {
  const { data, isLoading, isFetching, fetchMoreTx, hasMore, amount, refetch } = usePendingTxs()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Clear badge when user views pending transactions (whether from notification tap or normal navigation)
  React.useEffect(() => {
    BadgeManager.clearAllBadges().catch((error) => {
      Logger.error('PendingTxContainer: Failed to clear badges', error)
    })
  }, [])

  // Handle pull-to-refresh - reset the data and fetch from the beginning
  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Refetch will reset the data and start fresh with page 1
      await refetch()
    } catch (error) {
      Logger.error('Error refreshing pending transactions:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  // Combine loading states, but don't show loader when refreshing
  const isLoadingState = (isFetching && !isRefreshing) || isLoading

  return (
    <PendingTxListContainer
      transactions={data}
      onEndReached={fetchMoreTx}
      isLoading={isLoadingState}
      amount={amount}
      hasMore={!!hasMore}
      refreshing={isRefreshing}
      onRefresh={onRefresh}
    />
  )
}
