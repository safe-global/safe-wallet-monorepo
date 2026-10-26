import type {
  SpaceQueuedItemPage,
  SpaceQueueSafeItems,
  TransactionQueuedItem,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { AddressInfo, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
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

/** The `cursor` query param of a page's `next` URL, the only part the queue endpoint takes back. */
export const getNextCursor = (next: string | null | undefined): string | undefined => {
  if (!next) return undefined
  return new URL(next).searchParams.get('cursor') ?? undefined
}

const isSameSafe = (a: SpaceQueueSafeItems, b: SpaceQueueSafeItems): boolean =>
  a.chainId === b.chainId && sameAddress(a.safeAddress, b.safeAddress)

/** One section per Safe, in order of first appearance, joining every run of that Safe across the loaded pages. */
export const groupQueueBySafe = (pages: SpaceQueuedItemPage[]): SpaceQueueSafeItems[] => {
  return pages
    .flatMap((page) => page.results)
    .reduce<SpaceQueueSafeItems[]>((sections, run) => {
      const index = sections.findIndex((section) => isSameSafe(section, run))
      if (index === -1) return [...sections, run]

      const section = sections[index]
      // The gateway restarts a Safe's labels on every run, so a joined run would repeat "Queued"
      const labels = new Set(section.items.flatMap((item) => (item.type === 'LABEL' ? [item.label] : [])))
      const items = run.items.filter((item) => item.type !== 'LABEL' || !labels.has(item.label))
      return sections.map((other, i) => (i === index ? { ...section, items: [...section.items, ...items] } : other))
    }, [])
}

export const getNonce = (tx: Transaction): number | undefined =>
  isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo.nonce : undefined

export type QueueStatus = 'execute' | 'sign' | 'waiting' | 'blocked'

export const getQueueStatus = (tx: Transaction, isNext: boolean, walletAddress?: string): QueueStatus => {
  if (isAwaitingExecution(tx.txStatus)) return isNext ? 'execute' : 'blocked'
  return walletAddress && isSignableBy(tx, walletAddress) ? 'sign' : 'waiting'
}

export type QueueRowData =
  | { kind: 'conflict'; nonce: number | undefined; size: number }
  | { kind: 'transaction'; item: TransactionQueuedItem; isNext: boolean; inConflict: boolean }

/** The table rows of one Safe: its transactions, with a header row before each group sharing a nonce. */
export const getSectionRows = (items: SpaceQueueSafeItems['items']): QueueRowData[] => {
  let label: string | undefined
  return groupConflictingTxs(items).flatMap<QueueRowData>((entry) => {
    if (Array.isArray(entry)) {
      const transactions = entry.filter(isTransactionQueuedItem)
      if (transactions.length === 0) return []
      return [
        { kind: 'conflict', nonce: getNonce(transactions[0].transaction), size: transactions.length },
        ...transactions.map((item) => ({
          kind: 'transaction' as const,
          item,
          isNext: label === 'Next',
          inConflict: true,
        })),
      ]
    }
    if (isLabelListItem(entry)) {
      label = entry.label
      return []
    }
    if (isTransactionQueuedItem(entry)) {
      return [{ kind: 'transaction', item: entry, isNext: label === 'Next', inConflict: false }]
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
