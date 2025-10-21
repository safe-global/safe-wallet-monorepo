import { LabelValue } from '@safe-global/store/gateway/types'
import type { Transaction, QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { selectPendingTxIdsBySafe } from '@/store/pendingTxsSlice'
import useAsync from '@safe-global/utils/hooks/useAsync'
import {
  isConflictHeaderQueuedItem,
  isLabelListItem,
  isMultisigExecutionInfo,
  isTransactionListItem,
  isTransactionQueuedItem,
} from '@/utils/transaction-guards'
import useSafeInfo from './useSafeInfo'
import { shallowEqual } from 'react-redux'
import { getTransactionQueue } from '@/services/transactions'

export const usePendingTxIds = (): Array<Transaction['id']> => {
  const { safe, safeAddress } = useSafeInfo()
  const { chainId } = safe
  return useAppSelector((state) => selectPendingTxIdsBySafe(state, chainId, safeAddress), shallowEqual)
}

export const useHasPendingTxs = (): boolean => {
  const pendingIds = usePendingTxIds()
  return pendingIds.length > 0
}

/**
 * Show unsigned pending queue only in 1/X Safes
 */
export const useShowUnsignedQueue = (): boolean => {
  const { safe } = useSafeInfo()
  const hasPending = useHasPendingTxs()
  return safe.threshold === 1 && hasPending
}

export const filterUntrustedQueue = (untrustedQueue: QueuedItemPage, pendingIds: Array<Transaction['id']>) => {
  // Only keep labels and pending unsigned transactions
  const results = (untrustedQueue.results as Array<any>)
    .filter((item) => !isTransactionQueuedItem(item) || pendingIds.includes(item.transaction.id))
    .filter((item) => !isConflictHeaderQueuedItem(item))
    .filter(
      (item) =>
        !isTransactionQueuedItem(item) ||
        (isTransactionQueuedItem(item) &&
          isMultisigExecutionInfo(item.transaction.executionInfo) &&
          item.transaction.executionInfo.confirmationsSubmitted === 0),
    )

  // Adjust the first label ("Next" -> "Pending")
  if (results[0] && isLabelListItem(results[0])) {
    results[0].label = 'Pending' as LabelValue
  }

  const transactions = results.filter((item) => isTransactionListItem(item))

  return transactions.length ? { results } : undefined
}

export function getNextTransactions(queue: QueuedItemPage): QueuedItemPage {
  const queueLabelIndex = (queue.results as Array<any>).findIndex(
    (item) => isLabelListItem(item) && item.label === LabelValue.Queued,
  )
  const nextTransactions =
    queueLabelIndex === -1 ? queue.results : (queue.results as Array<any>).slice(0, queueLabelIndex)
  return { results: nextTransactions as any }
}

export const usePendingTxsQueue = (): {
  page?: QueuedItemPage
  error?: string
  loading: boolean
} => {
  const { safe, safeAddress } = useSafeInfo()
  const { chainId } = safe
  const pendingIds = usePendingTxIds()
  const hasPending = pendingIds.length > 0

  const [untrustedNext, error, loading] = useAsync<QueuedItemPage | undefined>(
    async () => {
      if (!hasPending) return
      const untrustedQueue = await getTransactionQueue(chainId, safeAddress, { trusted: false })
      return getNextTransactions(untrustedQueue)
    },
    [chainId, safeAddress, hasPending],
    false,
  )

  const pendingTxPage = useMemo(() => {
    if (!untrustedNext || !pendingIds.length) return

    return filterUntrustedQueue(untrustedNext, pendingIds)
  }, [untrustedNext, pendingIds])

  return useMemo(
    () => ({
      page: pendingTxPage,
      error: error?.message,
      loading,
    }),
    [pendingTxPage, error, loading],
  )
}
