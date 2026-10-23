import type { Account, Persona, Proposal } from '../types'
import { getConflicts, getCreatedAt, getState } from './model'
import { getStepKind, STEP_RANK } from './nextSteps'

// Option C · Action first: one workspace call to the Queue Service, then a "Needs you" list across Safes
// and everything else grouped by Safe.
const groupKey = (tx: Proposal) => `${tx.account}:${tx.nonce}`

// Rows you can sign or execute now, most urgent step first, then the one waiting longest. Nonces only compare
// within a Safe, so a Safe's rows keep their places but stay in nonce order. A conflict group comes whole.
export const getNeedsYou = (items: Proposal[], persona: Persona) => {
  const groups = new Map<string, { rank: number; created: number }>()
  for (const tx of items) {
    const kind = getStepKind(tx, persona)
    if (!kind) continue
    const step = { rank: STEP_RANK.indexOf(kind), created: getCreatedAt(tx) }
    const best = groups.get(groupKey(tx))
    if (!best || step.rank < best.rank || (step.rank === best.rank && step.created < best.created))
      groups.set(groupKey(tx), step)
  }
  const ranked = [...groups.entries()]
    .sort(([, a], [, b]) => a.rank - b.rank || a.created - b.created)
    .map(([key]) => items.find((tx) => groupKey(tx) === key)!)
  const bySafe = (account: string) => ranked.filter((tx) => tx.account === account).sort((a, b) => a.nonce - b.nonce)
  const seen = new Map<string, number>()
  const order = ranked.map((tx) => {
    const index = seen.get(tx.account) ?? 0
    seen.set(tx.account, index + 1)
    return groupKey(bySafe(tx.account)[index])
  })
  return order.flatMap((key) => items.filter((tx) => groupKey(tx) === key))
}

// The Safe band: next nonce, plus a badge when one applies.
export const getSafeBadges = (account: Account, items: Proposal[], persona: Persona) => {
  const queue = items.filter((tx) => tx.account === account.id)
  return {
    conflict: queue.some((tx) => getConflicts(tx, items).length > 0),
    blocked: queue.filter((tx) => getState(tx, persona).waiting).length,
  }
}

export const formatUpdated = (updatedAt: number, now: number) => {
  const seconds = Math.max(0, Math.floor((now - updatedAt) / 1000))
  if (seconds < 10) return 'Updated just now'
  if (seconds < 60) return `Updated ${Math.floor(seconds / 10) * 10}s ago`
  return `Updated ${Math.floor(seconds / 60)}m ago`
}
