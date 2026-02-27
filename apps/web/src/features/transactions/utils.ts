import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatAmountPrecise } from '@safe-global/utils/utils/formatNumber'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'

const MAX_DECIMALS = 4

/**
 * Rounds decimal numbers in a string to a max number of decimal places (e.g. for compact labels).
 * Uses shared formatAmountPrecise for consistent locale-aware formatting.
 */
export function formatAmountsInLabel(text: string, maxDecimals = MAX_DECIMALS): string {
  return text.replace(/\d+\.\d+/g, (match) => {
    const num = parseFloat(match)
    if (Number.isNaN(num)) return match
    return formatAmountPrecise(num, maxDecimals)
  })
}

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
  let label: string
  if ('humanDescription' in txInfo && txInfo.humanDescription) {
    label = txInfo.humanDescription
  } else if ('methodName' in txInfo && txInfo.methodName) {
    label = txInfo.methodName
  } else if (txInfo.type === 'Transfer' && 'direction' in txInfo) {
    label = txInfo.direction === 'OUTGOING' ? 'Send' : 'Received'
  } else {
    label = txInfo.type
  }
  return formatAmountsInLabel(label, MAX_DECIMALS)
}

/**
 * Splits the tx label into a first line (type, e.g. "Send") and rest (e.g. amount + recipient).
 */
export function getTxLabelParts(tx: TransactionQueuedItem): { primary: string; secondary: string } {
  const full = getTxLabel(tx)
  const spaceIndex = full.indexOf(' ')
  if (spaceIndex === -1) {
    return { primary: full, secondary: '' }
  }
  return {
    primary: full.slice(0, spaceIndex),
    secondary: full.slice(spaceIndex + 1).trim(),
  }
}

export function formatTxDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
