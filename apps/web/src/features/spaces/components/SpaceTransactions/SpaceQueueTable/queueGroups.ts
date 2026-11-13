import { weakMapMemoize } from '@reduxjs/toolkit'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { QueueGroupBy } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import { isMultisigExecutionInfo, isOneSignatureShort } from '@/utils/transaction-guards'
import type { SpaceQueueSection } from '../../../store/spaceQueueApi'
import {
  getNextNonce,
  getNonce,
  getQueueStatus,
  getRejectedNonces,
  getSafeKey,
  getSectionRows,
  type ConflictOption,
  type QueueStatus,
  type SignerWallets,
} from '../utils'

export type QueueTransaction = {
  item: TransactionQueuedItem
  status: QueueStatus
  conflict?: ConflictOption
  /** False when a rejection already holds this nonce */
  canReject: boolean
}

/** What moves as one: a transaction, or every option sharing its nonce on one Safe and chain. */
export type QueueUnit = {
  key: string
  scopeKey: string
  safeAddress: string
  chainId: string
  /** Position in the queue, Safe by Safe, chain by chain, in nonce order: the last tie-break */
  order: number
  isNext: boolean
  nextNonce?: number
  /** Set when options share a nonce: their header goes first */
  conflict?: { nonce?: number; size: number }
  transactions: QueueTransaction[]
  /** Its most urgent option, as ranked in the Status list */
  rank: number
  /** When its oldest option was proposed */
  createdAt: number
}

export type QueueGroupKind = 'all' | 'next' | 'behind' | 'network'

export type QueueGroup = { kind: QueueGroupKind; chainId?: string; units: QueueUnit[] }

export type OrderedGroupBy = Exclude<QueueGroupBy, 'safe'>

export const getChainKey = (safeAddress: string, chainId: string): string => `${getSafeKey(safeAddress)}:${chainId}`

export const getGroupId = (group: QueueGroup): string =>
  group.kind === 'network' ? `network-${group.chainId}` : group.kind

const isLastSignature = (tx: TransactionQueuedItem['transaction']): boolean =>
  isMultisigExecutionInfo(tx.executionInfo) &&
  isOneSignatureShort(tx.executionInfo.confirmationsSubmitted, tx.executionInfo.confirmationsRequired)

// What moves the queue forward comes first; waiting behind the next nonce sits with the blocked
const getRank = ({ status, item }: QueueTransaction, isNext: boolean): number => {
  if (status === 'execute') return 0
  if (status === 'sign') return isNext && isLastSignature(item.transaction) ? 1 : 2
  return status === 'waiting' && isNext ? 3 : 4
}

const toUnits = (sections: SpaceQueueSection[], signers: SignerWallets): QueueUnit[] => {
  const units: QueueUnit[] = []
  for (const { safeAddress, chains } of sections) {
    for (const { chainId, items } of chains) {
      const rows = getSectionRows(items)
      const nextNonce = getNextNonce(rows)
      const rejectedNonces = getRejectedNonces(rows)
      const scopeKey = getChainKey(safeAddress, chainId)
      const start = (key: string, conflict?: QueueUnit['conflict']): QueueUnit => {
        const unit: QueueUnit = {
          key,
          scopeKey,
          safeAddress,
          chainId,
          order: units.length,
          isNext: false,
          nextNonce,
          conflict,
          transactions: [],
          rank: 0,
          createdAt: 0,
        }
        units.push(unit)
        return unit
      }
      let conflictUnit: QueueUnit | undefined
      rows.forEach((row, index) => {
        if (row.kind === 'conflict') {
          conflictUnit = start(`conflict-${scopeKey}-${row.nonce}-${index}`, { nonce: row.nonce, size: row.size })
          return
        }
        const { transaction } = row.item
        const unit = row.conflict && conflictUnit ? conflictUnit : start(`unit-${transaction.id}`)
        unit.isNext = row.isNext
        unit.transactions.push({
          item: row.item,
          status: getQueueStatus(transaction, row.isNext, signers),
          conflict: row.conflict,
          canReject: !rejectedNonces.has(getNonce(transaction) ?? -1),
        })
      })
    }
  }
  for (const unit of units) {
    unit.rank = Math.min(...unit.transactions.map((transaction) => getRank(transaction, unit.isNext)))
    unit.createdAt = Math.min(...unit.transactions.map(({ item }) => item.transaction.timestamp))
  }
  return units
}

const byNetwork = (units: QueueUnit[]): QueueGroup[] => {
  const groups = new Map<string, QueueGroup>()
  for (const unit of units) {
    const group = groups.get(unit.chainId) ?? { kind: 'network', chainId: unit.chainId, units: [] }
    group.units.push(unit)
    groups.set(unit.chainId, group)
  }
  return [...groups.values()]
}

const byUrgency = (a: QueueUnit, b: QueueUnit): number =>
  a.rank - b.rank || a.createdAt - b.createdAt || a.order - b.order

const GROUPINGS: Record<OrderedGroupBy, (units: QueueUnit[]) => QueueGroup[]> = {
  status: (units) => [{ kind: 'all', units: [...units].sort(byUrgency) }],
  network: byNetwork,
  next: (units) =>
    [
      { kind: 'next' as const, units: units.filter((unit) => unit.isNext) },
      {
        kind: 'behind' as const,
        units: byNetwork(units.filter((unit) => !unit.isNext)).flatMap((group) => group.units),
      },
    ].filter((group) => group.units.length > 0),
}

/** The queue as units, worked out once per response and signer set, whichever grouping shows it. */
export const getQueueUnits = weakMapMemoize(toUnits)

/** The units arranged for a grouping, kept for each grouping of the same units so switching back is a lookup. */
export const getQueueGroups = weakMapMemoize((units: QueueUnit[], groupBy: OrderedGroupBy): QueueGroup[] =>
  GROUPINGS[groupBy](units),
)
