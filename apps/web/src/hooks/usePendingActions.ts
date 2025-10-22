import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isTransactionQueuedItem } from '@/utils/transaction-guards'
import { isSignableBy } from '@/utils/transaction-guards'
import { useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from './useSafeInfo'
import useTxQueue from './useTxQueue'
import useWallet from './wallets/useWallet'
import { getTransactionQueue } from '@/services/transactions'

type PendingActions = {
  totalQueued: string
  totalToSign: string
}

const getSignableCount = (queue: QueuedItemPage, walletAddress: string): number => {
  return (queue.results as Array<any>).filter(
    (tx) => isTransactionQueuedItem(tx) && isSignableBy(tx.transaction, walletAddress),
  ).length
}

const usePendingActions = (chainId: string, safeAddress?: string): PendingActions => {
  const wallet = useWallet()
  const { safeAddress: currentSafeAddress } = useSafeInfo()
  const { page: currentSafeQueue } = useTxQueue()
  const isCurrentSafe = currentSafeAddress === safeAddress

  const [loadedQueue] = useAsync<QueuedItemPage>(() => {
    if (isCurrentSafe || !safeAddress) return
    return getTransactionQueue(chainId, safeAddress)
  }, [chainId, safeAddress, isCurrentSafe])

  const queue = isCurrentSafe ? currentSafeQueue : loadedQueue

  return useMemo(
    () => ({
      // Return 20+ if more than one page, otherwise just the length
      totalQueued: queue
        ? ((queue.results as Array<any>).filter(isTransactionQueuedItem).length || '') + (queue.next ? '+' : '')
        : '',
      // Return the queued txs signable by wallet
      totalToSign: queue ? (getSignableCount(queue, wallet?.address || '') || '').toString() : '',
    }),
    [queue, wallet],
  )
}

export default usePendingActions
