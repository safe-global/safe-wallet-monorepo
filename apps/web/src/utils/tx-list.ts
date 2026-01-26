import type {
  QueuedItemPage,
  TransactionItem,
  TransactionItemPage,
  TransactionQueuedItem,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'

import {
  isConflictHeaderQueuedItem,
  isLabelListItem,
  isNoneConflictType,
  isTransactionListItem,
  isTransactionQueuedItem,
  type AnyResults,
} from '@/utils/transaction-guards'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'

export type AnyListItem = AnyResults

export type AnyTransactionItem = TransactionItem | TransactionQueuedItem

/**
 * Grouped result type for transaction lists.
 *
 * Returns an array where each element is either:
 * - A single item of type T (transaction, label, or header)
 * - An array of transaction items (AnyTransactionItem[])
 *
 * Note: Only transaction items get grouped into arrays.
 * Labels and headers are never grouped, so they always appear as single T items.
 */
export type Grouped<T extends AnyListItem> = Array<T | AnyTransactionItem[]>

export function groupTxs(list: AnyListItem[]): Grouped<AnyListItem> {
  // Runtime check: queue items have conflict headers, label items, or queue transaction items
  const isQueue = list.some(
    (it) => isConflictHeaderQueuedItem(it) || isLabelListItem(it) || isTransactionQueuedItem(it),
  )

  // Apply conflict grouping only for queue
  if (isQueue) {
    const queueList = list as QueuedItemPage['results']
    const grouped = groupConflictingTxs(queueList)
    return groupBulkTxs(grouped)
  }

  // For history, just apply bulk grouping
  return groupBulkTxs(list as AnyListItem[])
}

/**
 * Group txs by conflict header
 */
export const groupConflictingTxs = (list: QueuedItemPage['results']): Grouped<QueuedItemPage['results'][number]> => {
  return list
    .reduce<Grouped<QueuedItemPage['results'][number]>>((resultItems, item) => {
      if (isConflictHeaderQueuedItem(item)) {
        return resultItems.concat([[]])
      }

      const prevItem = resultItems[resultItems.length - 1]
      if (Array.isArray(prevItem) && isTransactionQueuedItem(item) && !isNoneConflictType(item)) {
        prevItem.push(item)
        return resultItems
      }

      return resultItems.concat(item)
    }, [])
    .map((item) => {
      if (Array.isArray(item)) {
        return item.sort((a, b) => b.transaction.timestamp - a.transaction.timestamp)
      }
      return item
    })
}

/**
 * Group txs by tx hash
 */
const groupBulkTxs = <T extends AnyListItem>(list: Array<T | AnyTransactionItem[]>): Grouped<T> => {
  return list
    .reduce<Grouped<T>>((resultItems, item) => {
      if (Array.isArray(item) || !isTransactionListItem(item)) {
        return resultItems.concat([item as T | AnyTransactionItem[]])
      }
      const currentTxHash = item.transaction.txHash

      const prevItem = resultItems[resultItems.length - 1]
      if (!Array.isArray(prevItem)) return resultItems.concat([[item]])
      const prevTxHash = prevItem[0].transaction.txHash

      if (currentTxHash && currentTxHash === prevTxHash) {
        prevItem.push(item)
        return resultItems
      }

      return resultItems.concat([[item]])
    }, [])
    .map((item) => (Array.isArray(item) && item.length === 1 ? item[0] : item)) as Grouped<T>
}

export function _getRecoveryCancellations(moduleAddress: string, transactions: Array<TransactionQueuedItem>) {
  const CANCELLATION_TX_METHOD_NAME = 'setTxNonce'

  return transactions.filter(({ transaction }) => {
    const { txInfo } = transaction
    return (
      txInfo.type === TransactionInfoType.CUSTOM &&
      sameAddress(txInfo.to.value, moduleAddress) &&
      txInfo.methodName === CANCELLATION_TX_METHOD_NAME
    )
  })
}

type GroupedRecoveryQueueItem = TransactionQueuedItem | RecoveryQueueItem

export function groupRecoveryTransactions(
  queue: Array<QueuedItemPage['results'][number]>,
  recoveryQueue: Array<RecoveryQueueItem>,
) {
  const transactions = queue.filter(isTransactionQueuedItem)

  return recoveryQueue.reduce<Array<RecoveryQueueItem | Array<GroupedRecoveryQueueItem>>>((acc, item) => {
    const cancellations = _getRecoveryCancellations(item.address, transactions)

    if (cancellations.length === 0) {
      acc.push(item)
    } else {
      acc.push([item, ...cancellations])
    }

    return acc
  }, [])
}

export const getLatestTransactions = (list: QueuedItemPage['results'] = []): TransactionQueuedItem[] => {
  return (
    groupConflictingTxs(list)
      // Get latest transaction if there are conflicting ones
      .map((group) => (Array.isArray(group) ? group[0] : group))
      .filter(isTransactionQueuedItem)
  )
}

export const isSamePage = (
  pageA: QueuedItemPage | TransactionItemPage,
  pageB: QueuedItemPage | TransactionItemPage,
): boolean => {
  return pageA.count === pageB.count && pageA.next === pageB.next
}
