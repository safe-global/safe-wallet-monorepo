import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { AddressInfo, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { groupConflictingTxs } from '@/utils/tx-list'
import {
  isAwaitingExecution,
  isCustomTxInfo,
  isIncomingTransfer,
  isMultiSendTxInfo,
  isTransferTxInfo,
  isLabelListItem,
  isMultisigExecutionInfo,
  isSignableBy,
  isTransactionQueuedItem,
} from '@/utils/transaction-guards'
import type { SpaceQueueItems } from '../../store/spaceQueueApi'

export const getSafeKey = (safeAddress: string): string => safeAddress.toLowerCase()

export const getNonce = (tx: Transaction): number | undefined =>
  isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo.nonce : undefined

export type QueueStatus = 'execute' | 'sign' | 'waiting' | 'blocked'

export const getQueueStatus = (tx: Transaction, isNext: boolean, walletAddress?: string): QueueStatus => {
  if (isAwaitingExecution(tx.txStatus)) return isNext ? 'execute' : 'blocked'
  return walletAddress && isSignableBy(tx, walletAddress) ? 'sign' : 'waiting'
}

export type QueueRowData =
  | { kind: 'conflict'; nonce: number | undefined; size: number }
  | { kind: 'transaction'; item: TransactionQueuedItem; isNext: boolean; conflict?: ConflictOption }

/** A transaction's place among those sharing its nonce, `option` counting from 1. */
export type ConflictOption = { option: number; size: number }

/** The table rows of one Safe on one chain: its transactions, with a header row before each group sharing a nonce. */
export const getSectionRows = (items: SpaceQueueItems): QueueRowData[] => {
  let label: string | undefined
  return groupConflictingTxs(items).flatMap<QueueRowData>((entry) => {
    if (Array.isArray(entry)) {
      const transactions = entry.filter(isTransactionQueuedItem)
      if (transactions.length === 0) return []
      return [
        { kind: 'conflict', nonce: getNonce(transactions[0].transaction), size: transactions.length },
        ...transactions.map((item, index) => ({
          kind: 'transaction' as const,
          item,
          isNext: label === 'Next',
          conflict: { option: index + 1, size: transactions.length },
        })),
      ]
    }
    if (isLabelListItem(entry)) {
      label = entry.label
      return []
    }
    if (isTransactionQueuedItem(entry)) {
      return [{ kind: 'transaction', item: entry, isNext: label === 'Next' }]
    }
    return []
  })
}

/** The other party shown after a transaction's summary, joined by "to", "from" or "via". */
export const getCounterparty = (txInfo: TransactionInfo): { join: string; party: AddressInfo } | undefined => {
  if (isTransferTxInfo(txInfo)) {
    return isIncomingTransfer(txInfo) ? { join: 'from', party: txInfo.sender } : { join: 'to', party: txInfo.recipient }
  }
  if (isMultiSendTxInfo(txInfo)) return { join: 'via', party: txInfo.to }
  if (isCustomTxInfo(txInfo)) return { join: 'to', party: txInfo.to }
  return undefined
}

/** The nonce the Safe executes next, or undefined when no loaded row sits under the "Next" label. */
export const getNextNonce = (rows: QueueRowData[]): number | undefined => {
  const next = rows.find((row) => row.kind === 'transaction' && row.isNext)
  return next?.kind === 'transaction' ? getNonce(next.item.transaction) : undefined
}
