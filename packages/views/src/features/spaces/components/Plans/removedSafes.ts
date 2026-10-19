import type { SafeRef } from './types'

/**
 * What leaving Safes out of a plan does to the Workspace. Seats are per address, so only a Safe
 * deselected on every one of its networks frees one; a Safe deselected on some networks keeps its seat.
 */
export type RemovedSafesSummary = {
  /** Safes leaving the Workspace altogether: every network of theirs is in the removed list. */
  accounts: number
  /** Safes staying in the Workspace on at least one network while losing others. */
  partialAccounts: number
  /** Networks removed from the partial Safes, over all of them. */
  partialNetworks: number
}

const keyOf = ({ chainId, address }: SafeRef): string => `${chainId}:${address.toLowerCase()}`

/**
 * Sorts the removed Safes into whole accounts and partial networks.
 * `leaves` is every Safe the Workspace holds, one per network; a removed address with no leaf left
 * outside `removed` (including when the leaves are not known) counts as a whole account.
 */
export const summarizeRemovedSafes = (leaves: SafeRef[], removed: SafeRef[]): RemovedSafesSummary => {
  const removedKeys = new Set(removed.map(keyOf))
  const networksByAddress = new Map<string, number>()
  for (const safe of removed) {
    const address = safe.address.toLowerCase()
    networksByAddress.set(address, (networksByAddress.get(address) ?? 0) + 1)
  }

  const summary: RemovedSafesSummary = { accounts: 0, partialAccounts: 0, partialNetworks: 0 }
  for (const [address, networks] of networksByAddress) {
    const isKept = leaves.some((leaf) => leaf.address.toLowerCase() === address && !removedKeys.has(keyOf(leaf)))
    if (isKept) {
      summary.partialAccounts += 1
      summary.partialNetworks += networks
    } else {
      summary.accounts += 1
    }
  }
  return summary
}

const count = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`

const partialPhrase = (partialAccounts: number, partialNetworks: number): string =>
  partialAccounts === 1 ? `${partialNetworks} of its networks only` : 'some of their networks only'

/** The note under a plan's accounts step and its change summary; empty when nothing is removed. */
export const removedSafesNote = ({ accounts, partialAccounts, partialNetworks }: RemovedSafesSummary): string => {
  const partial = partialPhrase(partialAccounts, partialNetworks)

  if (accounts > 0 && partialAccounts > 0) {
    const removed = accounts === 1 ? 'The removed account remains' : 'The removed accounts remain'
    const kept = partialAccounts === 1 ? 'the other keeps its seat' : 'the others keep their seats'
    return `${count(accounts, 'Safe account')} will be removed from the Workspace, and ${partialAccounts} more from ${partial}. ${removed} available in My accounts, ${kept}.`
  }
  if (partialAccounts > 0) {
    const kept =
      partialAccounts === 1
        ? 'It stays in the Workspace and keeps its seat.'
        : 'They stay in the Workspace and keep their seats.'
    return `${count(partialAccounts, 'Safe account')} will be removed from ${partial}. ${kept}`
  }
  if (accounts > 0) {
    const removed = accounts === 1 ? 'It remains' : 'They remain'
    return `${count(accounts, 'Safe account')} will be removed from the Workspace. ${removed} available in My accounts.`
  }
  return ''
}
