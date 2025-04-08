import React from 'react'

import { useGetTxsHistoryInfiniteQuery } from '@safe-global/store/gateway'
import type { TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TxHistoryList } from '@/src/features/TxHistory/components/TxHistoryList'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

export function TxHistoryContainer() {
  const activeSafe = useDefinedActiveSafe()

  // Using the infinite query hook
  const { currentData, fetchNextPage, hasNextPage, isFetching, isLoading, isUninitialized } =
    useGetTxsHistoryInfiniteQuery({
      chainId: activeSafe.chainId,
      safeAddress: activeSafe.address,
    })

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

  // Combine loading states
  const isLoadingState = isFetching || isLoading || isUninitialized

  return <TxHistoryList transactions={transactions} onEndReached={onEndReached} isLoading={isLoadingState} />
}
