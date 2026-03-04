import type { OwnerChange, SafeOwnerInfo, DeadlockCheckResult } from '../types'

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

export function checkDeadlock(
  editedSafeAddress: string,
  projectedOwners: string[],
  projectedThreshold: number,
  safeOwnerInfos: SafeOwnerInfo[],
): DeadlockCheckResult {
  const fetchFailures = safeOwnerInfos.filter((info) => info.fetchError).map((info) => info.address)

  if (fetchFailures.length > 0) {
    return {
      status: 'unknown',
      reason: 'Could not fetch owner data for one or more Safe signers.',
      hasDeepNesting: false,
      fetchFailures,
    }
  }

  // No Safe owners fetched means all owners are EOAs — valid, skip
  if (safeOwnerInfos.length === 0) {
    return {
      status: 'valid',
      hasDeepNesting: false,
      fetchFailures: [],
    }
  }

  const editedLower = editedSafeAddress.toLowerCase()
  let hasDeepNesting = false

  for (const info of safeOwnerInfos) {
    // Check for deeper nesting
    if (info.hasNestedSafes) {
      hasDeepNesting = true
    }

    // Check for mutual ownership: does this Safe owner list the edited Safe as its owner?
    const hasMutualOwnership = info.owners.some((owner) => owner.toLowerCase() === editedLower)

    if (hasMutualOwnership) {
      // Count how many signatures the edited Safe can collect WITHOUT this circular owner
      const nonCircularOwnerCount = projectedOwners.filter(
        (owner) => owner.toLowerCase() !== info.address.toLowerCase(),
      ).length

      if (nonCircularOwnerCount < projectedThreshold) {
        return {
          status: 'blocked',
          reason:
            'With this owner and threshold configuration, this Safe cannot collect enough valid signatures to execute transactions.',
          mutualOwnerAddress: info.address,
          hasDeepNesting,
          fetchFailures: [],
        }
      }
    }
  }

  if (hasDeepNesting) {
    return {
      status: 'warning',
      reason:
        'One or more Safe signers have their own Safe signers. Full signer safety could not be verified beyond direct owners.',
      hasDeepNesting: true,
      fetchFailures: [],
    }
  }

  return {
    status: 'valid',
    hasDeepNesting: false,
    fetchFailures: [],
  }
}
