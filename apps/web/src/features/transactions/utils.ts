import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'

export function getTxStatus(tx: TransactionQueuedItem): string {
  if (!isMultisigExecutionInfo(tx.transaction.executionInfo)) return ''

  const { confirmationsSubmitted, confirmationsRequired } = tx.transaction.executionInfo
  if (confirmationsSubmitted >= confirmationsRequired) {
    return 'Execution needed'
  }

  const missing = confirmationsRequired - confirmationsSubmitted
  return `${missing} signature${missing > 1 ? 's' : ''} needed`
}

export function getTxLabel(tx: TransactionQueuedItem): string {
  const { txInfo } = tx.transaction
  if ('humanDescription' in txInfo && txInfo.humanDescription) {
    return txInfo.humanDescription
  }
  if ('methodName' in txInfo && txInfo.methodName) {
    return txInfo.methodName
  }
  return txInfo.type
}

export function formatTxDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
