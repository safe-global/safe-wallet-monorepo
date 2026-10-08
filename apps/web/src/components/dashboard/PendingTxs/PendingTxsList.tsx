import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type ReactElement } from 'react'
import { useMemo } from 'react'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import dynamic from 'next/dynamic'
import { getLatestTransactions } from '@/utils/tx-list'
import PendingTxListItem from './PendingTxListItem'
import useTxQueue, { useQueuedTxsLength } from '@/hooks/useTxQueue'
import { AppRoutes } from '@/config/routes'
import { isSignableBy, isExecutable } from '@/utils/transaction-guards'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useRecoveryQueue } from '@/features/recovery'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { RecoveryQueueItem } from '@/features/recovery'
import { useUrlSpaceId, withSpaceId } from '@/hooks/useUrlSpaceId'
import { PendingTxsListView } from '@views/components/dashboard/PendingTxs/PendingTxsListView'

const PendingRecoveryListItem = dynamic(() => import('./PendingRecoveryListItem'))

const MAX_TXS = 4

function getActionableTransactions(
  txs: TransactionQueuedItem[],
  safe: SafeState,
  walletAddress?: string,
): TransactionQueuedItem[] {
  if (!walletAddress) {
    return txs
  }

  return txs.filter((tx) => {
    return isSignableBy(tx.transaction, walletAddress) || isExecutable(tx.transaction, walletAddress, safe)
  })
}

export function _getTransactionsToDisplay({
  recoveryQueue,
  queue,
  walletAddress,
  safe,
}: {
  recoveryQueue: RecoveryQueueItem[]
  queue: TransactionQueuedItem[]
  walletAddress?: string
  safe: SafeState
}): [RecoveryQueueItem[], TransactionQueuedItem[]] {
  if (recoveryQueue.length >= MAX_TXS) {
    return [recoveryQueue.slice(0, MAX_TXS), []]
  }

  const actionableQueue = getActionableTransactions(queue, safe, walletAddress)
  const _queue = actionableQueue.length > 0 ? actionableQueue : queue
  const queueToDisplay = _queue.slice(0, MAX_TXS - recoveryQueue.length)

  return [recoveryQueue, queueToDisplay]
}

const PendingTxsList = (): ReactElement | null => {
  const { page, loading } = useTxQueue()
  const { safe, safeLoaded, safeLoading } = useSafeInfo()
  const wallet = useWallet()
  const queuedTxns = useMemo(() => getLatestTransactions(page?.results), [page?.results])

  const recoveryQueue = useRecoveryQueue()
  const queueSize = useQueuedTxsLength()

  const [recoveryTxs, queuedTxs] = useMemo(() => {
    return _getTransactionsToDisplay({
      recoveryQueue,
      queue: queuedTxns,
      walletAddress: wallet?.address,
      safe,
    })
  }, [recoveryQueue, queuedTxns, wallet?.address, safe])

  const totalTxs = recoveryTxs.length + queuedTxs.length

  const isInitialState = !safeLoaded && !safeLoading
  const isLoading = loading || safeLoading || isInitialState

  const safeQueryParam = useSafeQueryParam()
  const spaceId = useUrlSpaceId()

  const queueUrl = useMemo(
    () => ({
      pathname: AppRoutes.transactions.queue,
      query: withSpaceId({ safe: safeQueryParam }, spaceId),
    }),
    [safeQueryParam, spaceId],
  )

  return (
    <PendingTxsListView
      isLoading={isLoading}
      queueSize={queueSize}
      totalTxs={totalTxs}
      queueUrl={queueUrl}
      recoveryItems={recoveryTxs.map((tx) => (
        <PendingRecoveryListItem transaction={tx} key={tx.transactionHash} />
      ))}
      queuedItems={queuedTxs.map((tx) => (
        <PendingTxListItem transaction={tx.transaction} key={tx.transaction.id} />
      ))}
    />
  )
}

export default PendingTxsList
