import { sameAddress } from './addresses'

/**
 * Compares two arrays of owner addresses to check if they match
 * @param owners1 - First array of owner addresses
 * @param owners2 - Second array of owner addresses
 * @returns true if both arrays contain the same addresses (order doesn't matter)
 */
export const areOwnersMatching = (owners1: string[], owners2: string[]): boolean =>
  owners1.length === owners2.length && owners1.every((owner) => owners2.some((owner2) => sameAddress(owner, owner2)))

/**
 * Interface for safe configuration data needed for comparison
 */
export interface SafeSetupData {
  owners: Array<{ value: string }> | Array<string>
  threshold: number
}

/**
 * Normalizes owner data to string array
 * @param owners - Owner data that can be either string array or object array with value property
 * @returns Array of owner address strings
 */
const normalizeOwners = (owners: Array<{ value: string }> | Array<string>): string[] => {
  return owners.map((owner) => (typeof owner === 'string' ? owner : owner.value))
}

/**
 * Compares two safe configurations to determine if they have the same setup
 * @param safe1 - First safe configuration
 * @param safe2 - Second safe configuration
 * @returns true if both safes have matching owners and threshold
 */
export const haveSameSetup = (
  safe1: SafeSetupData | null | undefined,
  safe2: SafeSetupData | null | undefined,
): boolean => {
  if (!safe1 || !safe2) {
    return false
  }

  const owners1 = normalizeOwners(safe1.owners)
  const owners2 = normalizeOwners(safe2.owners)

  const hasMatchingOwners = areOwnersMatching(owners1, owners2)
  const hasMatchingThreshold = safe1.threshold === safe2.threshold

  return hasMatchingOwners && hasMatchingThreshold
}
