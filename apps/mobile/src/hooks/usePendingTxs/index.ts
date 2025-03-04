import { useGetPendingTxsQuery } from '@safe-global/store/gateway'
import { useMemo, useState } from 'react'
import {
  ConflictHeaderQueuedItem,
  LabelQueuedItem,
  QueuedItemPage,
  TransactionQueuedItem,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { groupPendingTxs } from '@/src/features/PendingTx/utils'
import { safelyDecodeURIComponent } from 'expo-router/build/fork/getStateFromPath-forks'
import { useInfiniteScroll } from '../useInfiniteScroll'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

const usePendingTxs = () => {
  const activeSafe = useDefinedActiveSafe()
  const [pageUrl, setPageUrl] = useState<string>()

  const { data, isLoading, isFetching, refetch, isUninitialized } = useGetPendingTxsQuery(
    {
      chainId: activeSafe.chainId,
      safeAddress: activeSafe.address,
      cursor: pageUrl && safelyDecodeURIComponent(pageUrl?.split('cursor=')[1]),
    },
    {
      skip: !activeSafe.chainId,
    },
  )
  const { list, onEndReached: fetchMoreTx } = useInfiniteScroll<
    QueuedItemPage,
    ConflictHeaderQueuedItem | LabelQueuedItem | TransactionQueuedItem
  >({
    refetch,
    setPageUrl,
    data,
  })

  const pendingTxs = useMemo(() => groupPendingTxs(list || []), [list])

  return {
    hasMore: Boolean(data?.next),
    amount: pendingTxs.amount,
    data: pendingTxs.sections,
    fetchMoreTx,
    isLoading: isLoading || isUninitialized,
    isFetching: isFetching,
  }
}

export default usePendingTxs
