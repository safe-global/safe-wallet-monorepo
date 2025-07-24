import { useGetPendingTxsInfiniteQuery } from '@safe-global/store/gateway'
import { useMemo } from 'react'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { groupPendingTxs } from '@/src/features/PendingTx/utils'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

const usePendingTxs = () => {
  const activeSafe = useDefinedActiveSafe()

  const { currentData, fetchNextPage, hasNextPage, isFetching, isLoading, isUninitialized, refetch } =
    useGetPendingTxsInfiniteQuery(
      {
        chainId: activeSafe.chainId,
        safeAddress: activeSafe.address,
      },
      {
        skip: !activeSafe.chainId,
        pollingInterval: 10000,
      },
    )

  // Flatten all pages into a single transactions array
  const allPendingItems = useMemo(() => {
    if (!currentData?.pages) {
      return []
    }

    // Combine results from all pages
    return currentData.pages.flatMap((page: QueuedItemPage) => page.results || [])
  }, [currentData?.pages])

  const pendingTxs = useMemo(() => groupPendingTxs(allPendingItems), [allPendingItems])

  const fetchMoreTx = () => {
    if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }

  return {
    hasMore: hasNextPage,
    amount: pendingTxs.amount,
    data: pendingTxs.sections,
    fetchMoreTx,
    isLoading: isLoading || isUninitialized,
    isFetching: isFetching,
    refetch,
  }
}

export default usePendingTxs
