import type { PendingDelegation } from '@/features/proposers/types'
import type { DelegationWithTimestamp } from './delegationParsing'

/**
 * Keeps only the latest delegation per delegate address.
 * Uses lowercase address as key for consistent comparison.
 */
export function keepLatestPerDelegate(delegations: DelegationWithTimestamp[]): Map<string, DelegationWithTimestamp> {
  const latestByDelegate = new Map<string, DelegationWithTimestamp>()

  for (const delegation of delegations) {
    const key = delegation.delegateAddress.toLowerCase()
    const existing = latestByDelegate.get(key)
    if (!existing || delegation._timestamp > existing._timestamp) {
      latestByDelegate.set(key, delegation)
    }
  }

  return latestByDelegate
}

/**
 * Filters out delegations that have already been acted upon.
 * - "add" delegations are filtered if the delegate is already in currentDelegates
 * - "remove" delegations are filtered if the delegate is not in currentDelegates
 *
 * @param currentDelegates Set of lowercase delegate addresses
 */
export function filterActedUponDelegations(
  delegations: Map<string, DelegationWithTimestamp>,
  currentDelegates: Set<string>,
): PendingDelegation[] {
  const result: PendingDelegation[] = []

  for (const delegation of delegations.values()) {
    const isAlreadyDelegate = currentDelegates.has(delegation.delegateAddress.toLowerCase())

    if (delegation.action === 'add' && isAlreadyDelegate) continue
    if (delegation.action === 'remove' && !isAlreadyDelegate) continue

    const { _timestamp: _, ...cleanDelegation } = delegation
    result.push(cleanDelegation)
  }

  return result
}
