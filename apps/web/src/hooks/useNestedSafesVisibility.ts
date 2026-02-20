import { useMemo } from 'react'
import { useFilteredNestedSafes, type NestedSafeValidation } from './useFilteredNestedSafes'
import { useCuratedNestedSafes } from './useCuratedNestedSafes'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export type NestedSafeWithStatus = {
  address: string
  /** Whether this safe was deployed by a trusted deployer (owner/parent/parent-deployer) */
  isValid: boolean
  /** Whether this safe is curated (selected by user) */
  isCurated: boolean
}

type UseNestedSafesVisibilityResult = {
  /** All safes with their validation status */
  allSafesWithStatus: NestedSafeWithStatus[]
  /** Safes that should be visible in the dropdown (only curated safes after curation) */
  visibleSafes: NestedSafeWithStatus[]
  /** Whether user has completed curation for this parent safe */
  hasCompletedCuration: boolean
  /** Whether validation is in progress */
  isLoading: boolean
  /** Start the validation process (lazy loading) */
  startFiltering: () => void
  /** Whether validation has started */
  hasStarted: boolean
}

/**
 * Combined hook that manages nested safes visibility using curation model:
 * 1. Validation results (valid/invalid based on deployer) - for warning display
 * 2. Curation state (user-selected safes) - for visibility
 *
 * Visibility rules:
 * - Before curation: show all safes in manage mode
 * - After curation: show only curated (selected) safes
 */
export function useNestedSafesVisibility(rawNestedSafes: string[], chainId: string): UseNestedSafesVisibilityResult {
  const { validatedSafes, isLoading, startFiltering, hasStarted } = useFilteredNestedSafes(rawNestedSafes, chainId)
  const { curatedAddresses, hasCompletedCuration } = useCuratedNestedSafes()

  const allSafesWithStatus = useMemo((): NestedSafeWithStatus[] => {
    // Before validation starts, return with assumed valid status
    if (!hasStarted || isLoading) {
      return rawNestedSafes.map((address) => ({
        address,
        isValid: true, // Assume valid until checked
        isCurated: curatedAddresses.some((curated) => sameAddress(curated, address)),
      }))
    }

    return validatedSafes.map((validated: NestedSafeValidation) => ({
      address: validated.address,
      isValid: validated.isValid,
      isCurated: curatedAddresses.some((curated) => sameAddress(curated, validated.address)),
    }))
  }, [validatedSafes, curatedAddresses, hasStarted, isLoading, rawNestedSafes])

  const visibleSafes = useMemo(() => {
    // If curation is not complete, show no safes in dropdown (user sees manage mode)
    // If curation is complete, show only curated safes
    if (!hasCompletedCuration) {
      return []
    }
    return allSafesWithStatus.filter((safe) => safe.isCurated)
  }, [allSafesWithStatus, hasCompletedCuration])

  return {
    allSafesWithStatus,
    visibleSafes,
    hasCompletedCuration,
    isLoading,
    startFiltering,
    hasStarted,
  }
}
