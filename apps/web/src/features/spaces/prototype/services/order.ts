import type { Account, Persona, Proposal } from '../types'
import { getAccount, getCreatedAt, getPrimaryStatus } from './model'
import { getStepKind, STEP_RANK } from './nextSteps'
import { getFiat } from './columns'

// Option D · Flat table: one list across Safes, a default order, and a choice of order and grouping.

export type OrderBy = 'status' | 'nonce' | 'proposed' | 'value' | 'safe'
export type SortDirection = 'asc' | 'desc'
export type QueueOrder = { by: OrderBy; direction: SortDirection }
export type GroupBy = 'none' | 'safe' | 'network'
export type QueueDisplay = { order: QueueOrder; groupBy: GroupBy }

export const DEFAULT_DISPLAY: QueueDisplay = { order: { by: 'status', direction: 'asc' }, groupBy: 'none' }

export const ORDER_OPTIONS: { value: OrderBy; label: string; direction: SortDirection }[] = [
  { value: 'status', label: 'Needs you first', direction: 'asc' },
  { value: 'proposed', label: 'Proposed', direction: 'desc' },
  { value: 'nonce', label: 'Nonce', direction: 'asc' },
  { value: 'value', label: 'Value', direction: 'desc' },
  { value: 'safe', label: 'Safe name', direction: 'asc' },
]

export const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'none', label: 'No grouping' },
  { value: 'safe', label: 'Safe' },
  { value: 'network', label: 'Network' },
]

// Clicking a column header sorts by it. A second click reverses it.
export const COLUMN_ORDER: Record<string, OrderBy> = {
  Nonce: 'nonce',
  Safe: 'safe',
  Proposed: 'proposed',
  Status: 'status',
}

export const sortByColumn = (current: QueueOrder, by: OrderBy): QueueOrder =>
  current.by === by
    ? { by, direction: current.direction === 'asc' ? 'desc' : 'asc' }
    : { by, direction: ORDER_OPTIONS.find((option) => option.value === by)!.direction }

// Execute and last signatures first, then signatures, then rows waiting on others, then blocked rows.
export const getStatusRank = (tx: Proposal, persona: Persona) => {
  const kind = getStepKind(tx, persona)
  if (kind) return STEP_RANK.indexOf(kind)
  return getPrimaryStatus(tx, persona) === 'waiting' ? STEP_RANK.length + 1 : STEP_RANK.length
}

const getValue = (tx: Proposal) => {
  const fiat = getFiat(tx)
  return fiat ? Number(fiat.replace(/[^0-9.]/g, '')) : -1
}

type Cluster = { account: string; nonce: number; rows: Proposal[] }

// Options at one nonce on one Safe compete, so they always move together.
const toClusters = (items: Proposal[]): Cluster[] => {
  const clusters = new Map<string, Cluster>()
  items.forEach((tx) => {
    const key = `${tx.account}:${tx.nonce}`
    const cluster = clusters.get(key) ?? { account: tx.account, nonce: tx.nonce, rows: [] }
    cluster.rows.push(tx)
    clusters.set(key, cluster)
  })
  return [...clusters.values()]
}

export const orderQueue = (
  items: Proposal[],
  { order, persona, accounts }: { order: QueueOrder; persona: Persona; accounts: Account[] },
): Proposal[] => {
  const accountIndex = (id: string) => {
    const index = accounts.findIndex((account) => account.id === id)
    return index < 0 ? accounts.length : index
  }
  const keyed = toClusters(items).map((cluster) => ({
    cluster,
    status: Math.min(...cluster.rows.map((tx) => getStatusRank(tx, persona))),
    created: Math.min(...cluster.rows.map((tx) => getCreatedAt(tx))),
    value: Math.max(...cluster.rows.map(getValue)),
    safe: getAccount(cluster.rows[0]).name,
  }))
  type Keyed = (typeof keyed)[number]
  // Nonces only compare within a Safe, so ties fall back to the Safe, then its nonce.
  const tieBreak = (a: Keyed, b: Keyed) =>
    accountIndex(a.cluster.account) - accountIndex(b.cluster.account) || a.cluster.nonce - b.cluster.nonce
  const primary: Record<OrderBy, (a: Keyed, b: Keyed) => number> = {
    status: (a, b) => a.status - b.status || a.created - b.created,
    proposed: (a, b) => a.created - b.created,
    nonce: tieBreak,
    value: (a, b) => a.value - b.value,
    safe: (a, b) => a.safe.localeCompare(b.safe),
  }
  const sign = order.direction === 'asc' ? 1 : -1
  return keyed.sort((a, b) => sign * primary[order.by](a, b) || tieBreak(a, b)).flatMap(({ cluster }) => cluster.rows)
}

export type QueueGroup = { id: string; label: string; chainId?: string; iconAddress?: string; rows: Proposal[] }

// Groups appear in the order of their first row, so the chosen order also orders the groups.
export const groupQueue = (rows: Proposal[], groupBy: GroupBy): QueueGroup[] => {
  if (groupBy === 'none') return [{ id: 'all', label: 'All', rows }]
  const groups = new Map<string, QueueGroup>()
  rows.forEach((tx) => {
    const account = getAccount(tx)
    const id = groupBy === 'safe' ? `safe-${account.iconAddress}` : `network-${account.chainId}`
    const group = groups.get(id) ?? {
      id,
      label: groupBy === 'safe' ? (account.safeName ?? account.name) : account.network,
      ...(groupBy === 'safe' ? { iconAddress: account.iconAddress } : { chainId: account.chainId }),
      rows: [],
    }
    group.rows.push(tx)
    groups.set(id, group)
  })
  return [...groups.values()]
}

const STORAGE_KEY = 'prototype.pendingQueue.display'

export const loadDisplay = (): QueueDisplay => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<QueueDisplay> | null
    const by = ORDER_OPTIONS.find((option) => option.value === saved?.order?.by)?.value
    const direction = saved?.order?.direction === 'desc' ? 'desc' : 'asc'
    const groupBy = GROUP_OPTIONS.find((option) => option.value === saved?.groupBy)?.value
    return {
      order: by ? { by, direction } : DEFAULT_DISPLAY.order,
      groupBy: groupBy ?? DEFAULT_DISPLAY.groupBy,
    }
  } catch {
    return DEFAULT_DISPLAY
  }
}

export const saveDisplay = (display: QueueDisplay) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(display))
  } catch {
    // Private windows can block storage. The choice then lasts until reload.
  }
}
