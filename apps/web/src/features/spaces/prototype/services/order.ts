import type { Account, Persona, Proposal } from '../types'
import { getAccount, getCreatedAt, getRowStatus } from './model'
import { getStepKind, STEP_RANK } from './nextSteps'

// Group by: the default Status list, or rows grouped by next nonce, Safe or network, each in a fixed order.

// `none` is the Status choice: one list in status order with no group rows. `status` only orders that list.
export type GroupBy = 'none' | 'status' | 'safe' | 'network' | 'next'
export type OrderedGroupBy = Exclude<GroupBy, 'safe' | 'none'>
type SortBy = 'nonce' | 'oldest'
export type QueueDisplay = { groupBy: GroupBy }

export const GROUP_OPTIONS: { value: Exclude<GroupBy, 'none' | 'status'>; label: string; hint: string }[] = [
  { value: 'next', label: 'Up next', hint: 'Next transaction on each Safe' },
  { value: 'safe', label: 'Safe', hint: 'Grouped by Safe, network and nonce order' },
  { value: 'network', label: 'Network', hint: 'Grouped by network' },
]

// Each grouping has one fixed order. Grouped by Safe or network, nonces stay in sequence.
export const GROUP_SORT: Record<GroupBy, SortBy> = {
  none: 'oldest',
  status: 'oldest',
  safe: 'nonce',
  network: 'nonce',
  next: 'nonce',
}
export const DEFAULT_DISPLAY: QueueDisplay = { groupBy: 'none' }
export const STATUS_CHOICE = {
  value: 'none' as const,
  label: 'Status',
  hint: 'Transactions listed by order of urgency',
}
export const DISPLAY_CHOICES = [STATUS_CHOICE, ...GROUP_OPTIONS]

// With a wallet: your last signatures and executes first, then your signatures. Then Signing, Ready to sign, Blocked.
export const getStatusRank = (tx: Proposal, persona: Persona) => {
  const kind = getStepKind(tx, persona)
  if (kind) return STEP_RANK.indexOf(kind)
  return STEP_RANK.length + ['awaiting', 'sign', 'waiting'].indexOf(getRowStatus(tx))
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
  }))
  type Keyed = (typeof keyed)[number]
  // Nonces only compare within a Safe, so ties fall back to the Safe, then its nonce.
  const tieBreak = (a: Keyed, b: Keyed) =>
    accountIndex(a.cluster.account) - accountIndex(b.cluster.account) || a.cluster.nonce - b.cluster.nonce
  const compare: Record<SortBy, (a: Keyed, b: Keyed) => number> = {
    nonce: tieBreak,
    oldest: (a, b) => a.created - b.created,
  }
  return keyed.sort((a, b) => compare[sort](a, b) || tieBreak(a, b)).flatMap(({ cluster }) => cluster.rows)
}

export type QueueGroup = { id: string; label: string; chainId?: string; rows: Proposal[] }

// Ordered by how close each group is to done: nothing missing, then only your signature, then more.
const STATUS_GROUPS = [
  { id: 'status-execute', label: 'Ready to execute', ranks: [1] },
  // Your signature is the last one, so signing also executes.
  { id: 'status-sign-execute', label: 'Sign and execute', ranks: [0] },
  { id: 'status-sign', label: 'Ready to sign', ranks: [2, 3] },
  { id: 'status-awaiting', label: 'Signing', ranks: [STEP_RANK.length, STEP_RANK.length + 1] },
  { id: 'status-blocked', label: 'Blocked', ranks: [STEP_RANK.length + 2] },
]

export const isActionGroup = (group: QueueGroup) =>
  ['status-sign-execute', 'status-execute', 'status-sign'].includes(group.id)

const byNetwork = (rows: Proposal[]) => {
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

// Status groups come in a fixed order and drop when empty. A conflict group sits under its most urgent option.
// Network groups appear in the order of their first row.
// Next in line holds each Safe's next nonce on each network. Behind it holds the rest, by network, then Safe and nonce.
export const groupQueue = (rows: Proposal[], groupBy: OrderedGroupBy, persona: Persona): QueueGroup[] => {
  if (groupBy === 'next') {
    const isNext = (tx: Proposal) => tx.nonce === getAccount(tx).nextNonce
    return [
      { id: 'next', label: 'Next in line', rows: rows.filter(isNext) },
      {
        id: 'queue',
        label: 'Behind it',
        rows: byNetwork(rows.filter((tx) => !isNext(tx))).flatMap((group) => group.rows),
      },
    ].filter((group) => group.rows.length > 0)
  }
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
  return byNetwork(rows)
}

// Renamed when Status replaced None, so an old saved Status grouping doesn't come back.
const STORAGE_KEY = 'prototype.pendingQueue.groupBy'

export const loadDisplay = (): QueueDisplay => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<QueueDisplay> | null
    const groupBy = DISPLAY_CHOICES.find((choice) => choice.value === saved?.groupBy)?.value
    return groupBy ? { groupBy } : DEFAULT_DISPLAY
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
