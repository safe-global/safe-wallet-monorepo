import type { Account, Persona, Proposal } from '../types'
import { getAccount, getCreatedAt, getPrimaryStatus } from './model'
import { getStepKind, STEP_RANK } from './nextSteps'

// Option D · Flat table: rows grouped by status, Safe or network, each in a fixed order.

export type GroupBy = 'status' | 'safe' | 'network'
type SortBy = 'nonce' | 'oldest'
export type QueueDisplay = { groupBy: GroupBy }

export const GROUP_OPTIONS: { value: GroupBy; label: string; hint: string }[] = [
  { value: 'status', label: 'Status', hint: 'Show what needs your action first' },
  { value: 'safe', label: 'Safe', hint: 'Grouped by Safe and network in nonce order' },
  { value: 'network', label: 'Network', hint: 'Grouped by network, each Safe in nonce order' },
]

// Each grouping has one fixed order. Grouped by Safe or network, nonces stay in sequence.
export const GROUP_SORT: Record<GroupBy, SortBy> = { status: 'oldest', safe: 'nonce', network: 'nonce' }
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
