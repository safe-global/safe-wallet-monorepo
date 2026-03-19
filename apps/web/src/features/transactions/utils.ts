import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import type { RecoveryQueueItem } from '@/features/recovery'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { isExecutable, isSignableBy } from '@/utils/transaction-guards'

export function getTxStatus(tx: TransactionQueuedItem): string {
  if (!isMultisigExecutionInfo(tx.transaction.executionInfo)) return ''

  const { confirmationsSubmitted, confirmationsRequired } = tx.transaction.executionInfo
  if (confirmationsSubmitted >= confirmationsRequired) {
    return 'Execution needed'
  }

  const missing = confirmationsRequired - confirmationsSubmitted
  return `${missing} signature${missing > 1 ? 's' : ''} needed`
}

export function formatTxDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getActionableTransactions(
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
  maxTxs = 3,
}: {
  recoveryQueue: RecoveryQueueItem[]
  queue: TransactionQueuedItem[]
  walletAddress?: string
  safe: SafeState
  maxTxs?: number
}): [RecoveryQueueItem[], TransactionQueuedItem[]] {
  if (recoveryQueue.length >= maxTxs) {
    return [recoveryQueue.slice(0, maxTxs), []]
  }

  const actionableQueue = getActionableTransactions(queue, safe, walletAddress)
  const _queue = actionableQueue.length > 0 ? actionableQueue : queue
  const queueToDisplay = _queue.slice(0, maxTxs - recoveryQueue.length)

  return [recoveryQueue, queueToDisplay]
}
