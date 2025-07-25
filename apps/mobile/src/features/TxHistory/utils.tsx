import { HistoryTransactionItems } from '@safe-global/store/gateway/types'

export const getTxHash = (item: HistoryTransactionItems): string => {
  if (item.type !== 'TRANSACTION') {
    // For non-transaction items (like DateLabel), use type and timestamp for uniqueness
    if ('timestamp' in item && item.timestamp) {
      return `${item.type}_${item.timestamp}`
    }
    return `${item.type}_${Math.random().toString(36).substr(2, 9)}`
  }

  // For transaction items, use the transaction ID which should be unique
  return item.transaction.id || item.transaction.txHash || `tx_${Math.random().toString(36).substr(2, 9)}`
}
