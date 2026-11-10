import type { Account, Persona, Proposal } from '../types'
import { getAccount, getCreatedAt, getPrimaryStatus } from './model'
import { getStepKind, STEP_RANK } from './nextSteps'
import { getFiat } from './columns'

// Option D · Flat table: rows grouped by status, Safe or network, and sorted from the Sort menu or a column header.

export type GroupBy = 'status' | 'safe' | 'network'
export type SortBy = 'nonce' | 'newest' | 'oldest' | 'valueDesc' | 'valueAsc' | 'safeAsc' | 'safeDesc'
export type QueueDisplay = { groupBy: GroupBy; sort: SortBy }

export const GROUP_OPTIONS: { value: GroupBy; label: string; hint?: string }[] = [
  { value: 'status', label: 'Status', hint: 'Needs you first' },
  { value: 'safe', label: 'Safe', hint: 'Then network, in nonce order' },
  { value: 'network', label: 'Network' },
]

export const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'nonce', label: 'Nonce' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'newest', label: 'Newest' },
  { value: 'valueDesc', label: 'Largest value' },
  { value: 'valueAsc', label: 'Smallest value' },
  { value: 'safeAsc', label: 'Safe name, A to Z' },
  { value: 'safeDesc', label: 'Safe name, Z to A' },
]

// Each grouping starts from the order that reads best for it. Grouped by Safe, that is the nonce.
export const DEFAULT_SORT: Record<GroupBy, SortBy> = { status: 'oldest', safe: 'nonce', network: 'nonce' }
export const DEFAULT_DISPLAY: QueueDisplay = { groupBy: 'status', sort: DEFAULT_SORT.status }

const SORT_DIRECTION: Record<SortBy, 'asc' | 'desc'> = {
  nonce: 'asc',
  oldest: 'asc',
  newest: 'desc',
  valueDesc: 'desc',
  valueAsc: 'asc',
  safeAsc: 'asc',
  safeDesc: 'desc',
}

// A header's first click picks its first sort, the next click the second. Nonce only runs lowest first.
const COLUMN_SORTS: Record<string, [SortBy, SortBy]> = {
  Nonce: ['nonce', 'nonce'],
  Proposed: ['newest', 'oldest'],
  Safe: ['safeAsc', 'safeDesc'],
}

export const SORTABLE_COLUMNS = Object.keys(COLUMN_SORTS)

export const sortByColumn = (current: SortBy, column: string): SortBy => {
  const [first, second] = COLUMN_SORTS[column]
  return current === first ? second : first
}

export const getColumnSort = (sort: SortBy) => {
  const column = Object.entries(COLUMN_SORTS).find(([, sorts]) => sorts.includes(sort))?.[0]
  return column ? { column, direction: SORT_DIRECTION[sort] } : undefined
}

// Last signatures and executes first, then signatures, then rows waiting on others, then blocked rows.
export const getStatusRank = (tx: Proposal, persona: Persona) => {
  const kind = getStepKind(tx, persona)
  if (kind) return STEP_RANK.indexOf(kind)
  return getPrimaryStatus(tx, persona) === 'waiting' ? STEP_RANK.length + 1 : STEP_RANK.length
}

const getValue = (tx: Proposal) => {
  const fiat = getFiat(tx)
  return fiat ? Number(fiat.replace(/[^0-9.]/g, '')) : -1
}

const clusterKey = (tx: Proposal) => `${tx.account}:${tx.nonce}`

type Cluster = { account: string; nonce: number; rows: Proposal[] }

// Options at one nonce on one Safe compete, so they always move together.
const toClusters = (items: Proposal[]): Cluster[] => {
  const clusters = new Map<string, Cluster>()
  items.forEach((tx) => {
    const cluster = clusters.get(clusterKey(tx)) ?? { account: tx.account, nonce: tx.nonce, rows: [] }
    cluster.rows.push(tx)
    clusters.set(clusterKey(tx), cluster)
  })
  return [...clusters.values()]
}

export const orderQueue = (items: Proposal[], { sort, accounts }: { sort: SortBy; accounts: Account[] }) => {
  const accountIndex = (id: string) => {
    const index = accounts.findIndex((account) => account.id === id)
    return index < 0 ? accounts.length : index
  }
  const keyed = toClusters(items).map((cluster) => ({
    cluster,
    created: Math.min(...cluster.rows.map((tx) => getCreatedAt(tx))),
    value: Math.max(...cluster.rows.map(getValue)),
    safe: getAccount(cluster.rows[0]).name,
  }))
  type Keyed = (typeof keyed)[number]
  // Nonces only compare within a Safe, so ties fall back to the Safe, then its nonce.
  const tieBreak = (a: Keyed, b: Keyed) =>
    accountIndex(a.cluster.account) - accountIndex(b.cluster.account) || a.cluster.nonce - b.cluster.nonce
  const compare: Record<SortBy, (a: Keyed, b: Keyed) => number> = {
    nonce: tieBreak,
    oldest: (a, b) => a.created - b.created,
    newest: (a, b) => b.created - a.created,
    valueDesc: (a, b) => b.value - a.value,
    valueAsc: (a, b) => a.value - b.value,
    safeAsc: (a, b) => a.safe.localeCompare(b.safe),
    safeDesc: (a, b) => b.safe.localeCompare(a.safe),
  }
  return keyed.sort((a, b) => compare[sort](a, b) || tieBreak(a, b)).flatMap(({ cluster }) => cluster.rows)
}

export type QueueGroup = { id: string; label: string; chainId?: string; rows: Proposal[] }

const STATUS_GROUPS = [
  // Your signature is the last one, so signing also executes. These come first, as agreed in October.
  { id: 'status-sign-execute', label: 'Sign and execute', ranks: [0] },
  { id: 'status-execute', label: 'Ready to execute', ranks: [1] },
  { id: 'status-sign', label: 'Ready to sign', ranks: [2, 3] },
  { id: 'status-awaiting', label: 'Waiting on others', ranks: [STEP_RANK.length] },
  { id: 'status-blocked', label: 'Blocked', ranks: [STEP_RANK.length + 1] },
]

export const isActionGroup = (group: QueueGroup) =>
  ['status-sign-execute', 'status-execute', 'status-sign'].includes(group.id)

// Status groups come in a fixed order and drop when empty. A conflict group sits under its most urgent option.
// Network groups appear in the order of their first row.
export const groupQueue = (rows: Proposal[], groupBy: 'status' | 'network', persona: Persona): QueueGroup[] => {
  if (groupBy === 'status') {
    const rank = new Map<string, number>()
    rows.forEach((tx) => {
      const current = rank.get(clusterKey(tx))
      const next = getStatusRank(tx, persona)
      rank.set(clusterKey(tx), current === undefined ? next : Math.min(current, next))
    })
    return STATUS_GROUPS.map(({ id, label, ranks }) => ({
      id,
      label,
      rows: rows.filter((tx) => ranks.includes(rank.get(clusterKey(tx))!)),
    })).filter((group) => group.rows.length > 0)
  }
  const groups = new Map<string, QueueGroup>()
  rows.forEach((tx) => {
    const { chainId, network } = getAccount(tx)
    const id = `network-${chainId}`
    const group = groups.get(id) ?? { id, label: network, chainId, rows: [] }
    group.rows.push(tx)
    groups.set(id, group)
  })
  return [...groups.values()]
}

const STORAGE_KEY = 'prototype.pendingQueue.display'

export const loadDisplay = (): QueueDisplay => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<QueueDisplay> | null
    const groupBy = GROUP_OPTIONS.find((option) => option.value === saved?.groupBy)?.value
    const sort = SORT_OPTIONS.find((option) => option.value === saved?.sort)?.value
    if (!groupBy) return DEFAULT_DISPLAY
    return { groupBy, sort: sort ?? DEFAULT_SORT[groupBy] }
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
