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
 * - "edit" delegations are filtered if the delegate doesn't exist OR the label already matches (edit applied)
 * - "remove" delegations are filtered if the delegate is not in currentDelegates
 *
 * @param currentDelegates Map of lowercase delegate address -> current label
 */
export function filterActedUponDelegations(
  delegations: Map<string, DelegationWithTimestamp>,
  currentDelegates: Map<string, string>,
): PendingDelegation[] {
  const result: PendingDelegation[] = []

  for (const delegation of delegations.values()) {
    const delegateLower = delegation.delegateAddress.toLowerCase()
    const currentLabel = currentDelegates.get(delegateLower)
    const isAlreadyDelegate = currentLabel !== undefined

    if (delegation.action === 'add' && isAlreadyDelegate) continue
    if (delegation.action === 'edit') {
      // Filter if delegate doesn't exist OR if label already matches (edit was applied)
      if (!isAlreadyDelegate || currentLabel === delegation.delegateLabel) continue
    }
    if (delegation.action === 'remove' && !isAlreadyDelegate) continue

    const { _timestamp: _, ...cleanDelegation } = delegation
    result.push(cleanDelegation)
  }

  return result
}
