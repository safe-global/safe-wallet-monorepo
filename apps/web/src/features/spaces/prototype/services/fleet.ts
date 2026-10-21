import type { Account, Persona, Proposal } from '../types'
import { isUntrusted } from '../components/RiskFlag'
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

export type PulseKey = 'emergency' | 'conflicting' | 'stale' | 'untrusted'
export const PULSE: Record<
  PulseKey,
  { label: string; hint: string; match: (tx: Proposal, persona: Persona, items: Proposal[]) => boolean }
> = {
  emergency: {
    label: 'Urgent',
    hint: 'Incident response. Their Safes are pinned to the top.',
    match: (tx) => getOpsKind(tx) === 'emergency',
  },
  conflicting: {
    label: 'Conflicting',
    hint: 'Proposals that share a nonce with another. Only one per nonce can execute.',
    match: (tx, _persona, items) => getConflicts(tx, items).length > 0,
  },
  stale: {
    label: 'Stale 7 days',
    hint: 'Proposed more than a week ago and still pending.',
    match: (tx) => isStale(tx),
  },
  untrusted: {
    label: 'Untrusted',
    hint: 'Unsigned proposals that anyone could have created.',
    match: (tx) => isUntrusted(tx),
  },
}

// Only signals no other control shows at a glance. Each one is a shortcut to a filter.
const PULSE_ORDER: PulseKey[] = ['conflicting', 'untrusted', 'stale']
// `count` lets the page skip the card filters, so selecting one card doesn't zero the others.
export const getPulse = (
  items: Proposal[],
  persona: Persona,
  count = (match: (tx: Proposal) => boolean) => items.filter(match).length,
) => PULSE_ORDER.map((key) => ({ key, count: count((tx) => PULSE[key].match(tx, persona, items)) }))

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

// Safes with an emergency go first. Array sort is stable, so the rest keep their order.
export const pinEmergencies = (order: string[], items: Proposal[]) => {
  const urgent = new Set(items.filter((tx) => getOpsKind(tx) === 'emergency').map((tx) => tx.account))
  return [...order].sort((a, b) => Number(urgent.has(b)) - Number(urgent.has(a)))
}
