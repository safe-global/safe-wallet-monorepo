import type { Account, Persona, Proposal } from '../types'
import { getAccount, getCreatedAt, getPrimaryStatus } from './model'
import { getStepKind, STEP_RANK } from './nextSteps'

// Option D · Flat table: rows grouped by status, Safe, network or next nonce, each in a fixed order.

export type GroupBy = 'status' | 'safe' | 'network' | 'next'
export type OrderedGroupBy = Exclude<GroupBy, 'safe'>
type SortBy = 'nonce' | 'oldest'
export type QueueDisplay = { groupBy: GroupBy }

// `card` and `short` are the title and one-line explanation on option E's cards.
export const GROUP_OPTIONS: { value: GroupBy; label: string; hint: string; card: string; short: string }[] = [
  {
    value: 'status',
    label: 'Status',
    hint: 'Show what needs your action first',
    card: 'Status',
    short: 'Transactions that need your action first',
  },
  {
    value: 'next',
    label: 'Up next',
    hint: 'The next transaction on each Safe, then the ones behind it',
    card: 'Up next',
    short: 'Next transaction on each Safe',
  },
  {
    value: 'safe',
    label: 'Safe',
    hint: 'Grouped by Safe and network in nonce order',
    card: 'Safes',
    short: 'Transactions grouped by Safe, network, and nonce',
  },
  {
    value: 'network',
    label: 'Network',
    hint: 'Grouped by network, each Safe in nonce order',
    card: 'Networks',
    short: 'Transactions grouped by network',
  },
]

// Each grouping has one fixed order. Grouped by Safe or network, nonces stay in sequence.
export const GROUP_SORT: Record<GroupBy, SortBy> = {
  status: 'oldest',
  safe: 'nonce',
  network: 'nonce',
  next: 'nonce',
}
export const DEFAULT_DISPLAY: QueueDisplay = { groupBy: 'status' }

// Last signatures and executes first, then signatures, then rows waiting on others, then blocked rows.
export const getStatusRank = (tx: Proposal, persona: Persona) => {
  const kind = getStepKind(tx, persona)
  if (kind) return STEP_RANK.indexOf(kind)
  return getPrimaryStatus(tx, persona) === 'waiting' ? STEP_RANK.length + 1 : STEP_RANK.length
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

// Option E's card numbers: what needs you, Safes and networks with pending rows, and rows next in line.
export const getGroupCounts = (rows: Proposal[], persona: Persona): Record<GroupBy, number> => ({
  status: groupQueue(rows, 'status', persona)
    .filter(isActionGroup)
    .reduce((sum, group) => sum + group.rows.length, 0),
  safe: new Set(rows.map((tx) => getAccount(tx).iconAddress)).size,
  network: new Set(rows.map((tx) => getAccount(tx).chainId)).size,
  next: rows.filter((tx) => tx.nonce === getAccount(tx).nextNonce).length,
})

// Options D and E each remember their own grouping.
const STORAGE_KEYS = { flat: 'prototype.pendingQueue.display', cards: 'prototype.pendingQueue.display.cards' }
export type DisplayOption = keyof typeof STORAGE_KEYS

export const loadDisplay = (option: DisplayOption = 'flat'): QueueDisplay => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS[option]) ?? 'null') as Partial<QueueDisplay> | null
    const groupBy = GROUP_OPTIONS.find((option) => option.value === saved?.groupBy)?.value
    return groupBy ? { groupBy } : DEFAULT_DISPLAY
  } catch {
    return DEFAULT_DISPLAY
  }
}

export const saveDisplay = (display: QueueDisplay, option: DisplayOption = 'flat') => {
  try {
    localStorage.setItem(STORAGE_KEYS[option], JSON.stringify(display))
  } catch {
    // Private windows can block storage. The choice then lasts until reload.
  }
}
