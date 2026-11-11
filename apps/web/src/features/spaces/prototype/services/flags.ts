import type { Account, Persona, Proposal } from '../types'
import { getCreatedAt, getOutstandingSigners, getState, isWorkspaceMember } from './model'

// Flags and the signer filter: stale proposals, and who each transaction still waits on.
const STALE_AFTER = 7 * 86_400_000
export const isStale = (tx: Proposal, now = Date.now()) => now - getCreatedAt(tx, now) >= STALE_AFTER

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
