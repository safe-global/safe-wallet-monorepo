import type { OwnerChange, SafeOwnerInfo, DeadlockCheckResult } from '../types'
import { DeadlockReason, DeadlockStatus } from '../types'

export function computeProjectedState(
  currentOwners: string[],
  currentThreshold: number,
  change: OwnerChange,
): { owners: string[]; threshold: number } {
  switch (change.type) {
    case 'addOwner':
      return {
        owners: [...currentOwners, change.ownerAddress],
        threshold: change.threshold,
      }
    case 'removeOwner':
      return {
        owners: currentOwners.filter((o) => o.toLowerCase() !== change.ownerAddress.toLowerCase()),
        threshold: change.threshold,
      }
    case 'swapOwner':
      return {
        owners: currentOwners.map((o) =>
          o.toLowerCase() === change.oldOwnerAddress.toLowerCase() ? change.newOwnerAddress : o,
        ),
        threshold: currentThreshold,
      }
    case 'changeThreshold':
      return {
        owners: [...currentOwners],
        threshold: change.threshold,
      }
  }
}

function detectMutualDeadlock(
  info: SafeOwnerInfo,
  editedSafeAddress: string,
  projectedOwners: string[],
  projectedThreshold: number,
): boolean {
  const hasMutualOwnership = info.owners.some((owner) => owner.toLowerCase() === editedSafeAddress.toLowerCase())
  if (!hasMutualOwnership) return false

  const nonCircularOwnerCount = projectedOwners.filter(
    (owner) => owner.toLowerCase() !== info.address.toLowerCase(),
  ).length
  return nonCircularOwnerCount < projectedThreshold
}

export function checkDeadlock(
  editedSafeAddress: string,
  projectedOwners: string[],
  projectedThreshold: number,
  safeOwnerInfos: SafeOwnerInfo[],
): DeadlockCheckResult {
  const fetchFailures = safeOwnerInfos.filter((info) => info.fetchError).map((info) => info.address)

  if (fetchFailures.length > 0) {
    return {
      status: DeadlockStatus.UNKNOWN,
      reason: DeadlockReason.FETCH_FAILURE,
      hasDeepNesting: false,
      fetchFailures,
    }
  }

  // No Safe owners fetched means all owners are EOAs — valid, skip
  if (safeOwnerInfos.length === 0) {
    return {
      status: DeadlockStatus.VALID,
      hasDeepNesting: false,
      fetchFailures: [],
    }
  }

  let hasDeepNesting = false

  for (const info of safeOwnerInfos) {
    if (info.hasNestedSafes) {
      hasDeepNesting = true
    }

    if (detectMutualDeadlock(info, editedSafeAddress, projectedOwners, projectedThreshold)) {
      return {
        status: DeadlockStatus.BLOCKED,
        reason: DeadlockReason.MUTUAL_DEADLOCK,
        mutualOwnerAddress: info.address,
        hasDeepNesting,
        fetchFailures: [],
      }
    }
  }

  if (hasDeepNesting) {
    return {
      status: DeadlockStatus.WARNING,
      reason: DeadlockReason.DEEP_NESTING,
      hasDeepNesting: true,
      fetchFailures: [],
    }
  }

  return {
    status: DeadlockStatus.VALID,
    hasDeepNesting: false,
    fetchFailures: [],
  }
}
