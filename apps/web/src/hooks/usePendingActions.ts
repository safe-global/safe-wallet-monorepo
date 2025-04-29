import { isTransactionListItem } from '@/utils/transaction-guards'
import { isSignableBy } from '@/utils/transaction-guards'
import type { TransactionListPage } from '@safe-global/safe-gateway-typescript-sdk'
import { getTransactionQueue } from '@safe-global/safe-gateway-typescript-sdk'
import { useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from './useSafeInfo'
import useTxQueue from './useTxQueue'
import useWallet from './wallets/useWallet'

type PendingActions = {
  totalQueued: string
  totalToSign: string
}

const getSignableCount = (queue: TransactionListPage, walletAddress: string): number => {
  return queue.results.filter((tx) => isTransactionListItem(tx) && isSignableBy(tx.transaction, walletAddress)).length
}

const usePendingActions = (chainId: string, safeAddress?: string): PendingActions => {
  const wallet = useWallet()
  const { safeAddress: currentSafeAddress } = useSafeInfo()
  const { page: currentSafeQueue } = useTxQueue()
  const isCurrentSafe = currentSafeAddress === safeAddress

  const [loadedQueue] = useAsync<TransactionListPage>(() => {
    if (isCurrentSafe || !safeAddress) return
    return getTransactionQueue(chainId, safeAddress)
  }, [chainId, safeAddress, isCurrentSafe])

  const queue = isCurrentSafe ? currentSafeQueue : loadedQueue

  return useMemo(
    () => ({
      // Return 20+ if more than one page, otherwise just the length
      totalQueued: queue ? (queue.results.filter(isTransactionListItem).length || '') + (queue.next ? '+' : '') : '',
      // Return the queued txs signable by wallet
      totalToSign: queue ? (getSignableCount(queue, wallet?.address || '') || '').toString() : '',
    }),
    [queue, wallet],
  )
}

export default usePendingActions
