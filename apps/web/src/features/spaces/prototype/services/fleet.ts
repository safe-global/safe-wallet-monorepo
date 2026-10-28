import type { Account, Persona, Proposal } from '../types'
import { getConflicts, getCreatedAt, getOutstandingSigners, getState, isWorkspaceMember } from './model'

// Fleet admin: the three kinds of work a protocol team runs across its Safes.
export type OpsKind = 'emergency' | 'config' | 'routine'
export const getOpsKind = (tx: Proposal): OpsKind =>
  tx.emergency ? 'emergency' : tx.kind.type === 'settings' ? 'config' : 'routine'

const STALE_AFTER = 7 * 86_400_000
export const isStale = (tx: Proposal, now = Date.now()) => now - getCreatedAt(tx, now) >= STALE_AFTER

export type ProposedWithin = 'day' | 'week' | 'stale' | 'month'
const DAY = 86_400_000
export const PROPOSED_OPTIONS: { value: ProposedWithin; label: string; match: (age: number) => boolean }[] = [
  { value: 'day', label: 'Last 24 hours', match: (age) => age < DAY },
  { value: 'week', label: 'Last 7 days', match: (age) => age < 7 * DAY },
  { value: 'stale', label: 'Older than 7 days', match: (age) => age >= 7 * DAY },
  { value: 'month', label: 'Older than 30 days', match: (age) => age >= 30 * DAY },
]
export const proposedWithin = (tx: Proposal, value: ProposedWithin, now = Date.now()) =>
  PROPOSED_OPTIONS.find((option) => option.value === value)!.match(now - getCreatedAt(tx, now))

export type SignerLoad = { id: string; txs: Proposal[]; safes: string[]; oldest?: number; member: boolean }
// Every signer across the given Safes, most transactions waiting on them first. Those with none come last.
export const getSignerLoad = (
  items: Proposal[],
  accounts: Account[],
  persona: Persona,
  now = Date.now(),
): SignerLoad[] => {
  const pending = items.filter((tx) => getState(tx, persona).missing > 0)
  return [...new Set(accounts.flatMap((account) => account.owners))]
    .map((id) => {
      const txs = pending.filter((tx) => getOutstandingSigners(tx).includes(id))
      return {
        id,
        txs,
        safes: [...new Set(txs.map((tx) => tx.account))],
        oldest: txs.length ? Math.min(...txs.map((tx) => getCreatedAt(tx, now))) : undefined,
        member: isWorkspaceMember(id),
      }
    })
    .sort((a, b) => b.txs.length - a.txs.length || (a.oldest ?? Infinity) - (b.oldest ?? Infinity))
}

export const hasConflicts = (account: string, items: Proposal[]) =>
  items.some((tx) => tx.account === account && getConflicts(tx, items).length > 0)

// Safes with conflicting transactions go first. Array sort is stable, so the rest keep their order.
export const pinConflicting = (order: string[], items: Proposal[]) =>
  [...order].sort((a, b) => Number(hasConflicts(b, items)) - Number(hasConflicts(a, items)))
