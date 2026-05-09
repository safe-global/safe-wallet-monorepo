import { HistoryTransactionItems } from '@safe-global/store/gateway/types'
import { getGroupHash, getTxHash } from '@/src/features/TxHistory/utils'
import { isDateLabel } from '@/src/utils/transaction-guards'

export const keyExtractor = (item: HistoryTransactionItems | HistoryTransactionItems[]) => {
  return Array.isArray(item) ? getGroupHash(item) : getTxHash(item)
}

export const getItemType = (item: HistoryTransactionItems | HistoryTransactionItems[]) => {
  if (Array.isArray(item)) {
    return 'groupedTransaction'
  }
  if (isDateLabel(item)) {
    return 'dateHeader'
  }
  if (item.type === 'TRANSACTION') {
    return 'transaction'
  }
  return 'unknown'
}
