import { useMemo } from 'react'
import useManuallyHiddenSafes from './useManuallyHiddenSafes'
import useOverriddenAutoHideSafes from './useOverriddenAutoHideSafes'
import { useFilteredNestedSafes, type NestedSafeValidation } from './useFilteredNestedSafes'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export type NestedSafeWithStatus = {
  address: string
  isValid: boolean
  isAutoHidden: boolean
  isManuallyHidden: boolean
  isUserUnhidden: boolean
}

type UseNestedSafesVisibilityResult = {
  /** All safes with their validation and visibility status */
  allSafesWithStatus: NestedSafeWithStatus[]
  /** Safes that should be visible in the list (not hidden) */
  visibleSafes: NestedSafeWithStatus[]
  /** Count of auto-hidden safes (invalid and not user-unhidden) */
  autoHiddenCount: number
  /** Count of manually hidden safes */
  manuallyHiddenCount: number
  /** Whether validation is in progress */
  isLoading: boolean
  /** Start the validation process (lazy loading) */
  startFiltering: () => void
  /** Whether validation has started */
  hasStarted: boolean
}

/**
 * Combined hook that manages nested safes visibility by combining:
 * 1. Validation results (valid/invalid based on deployer)
 * 2. Manual hide preferences (user explicitly hid)
 * 3. User unhide overrides (user explicitly unhid auto-hidden safes)
 *
 * Visibility rules:
 * - Valid safes are visible unless manually hidden
 * - Invalid safes are auto-hidden unless user explicitly unhid them
 * - Manually hidden safes are always hidden (both valid and invalid)
 */
export function useNestedSafesVisibility(rawNestedSafes: string[], chainId: string): UseNestedSafesVisibilityResult {
  const { validatedSafes, isLoading, startFiltering, hasStarted } = useFilteredNestedSafes(rawNestedSafes, chainId)
  const manuallyHiddenSafes = useManuallyHiddenSafes()
  const overriddenAutoHideSafes = useOverriddenAutoHideSafes()

  const allSafesWithStatus = useMemo((): NestedSafeWithStatus[] => {
    // Before validation starts, return empty statuses
    if (!hasStarted || isLoading) {
      return rawNestedSafes.map((address) => ({
        address,
        isValid: true, // Assume valid until checked
        isAutoHidden: false,
        isManuallyHidden: manuallyHiddenSafes.some((hidden) => sameAddress(hidden, address)),
        isUserUnhidden: false,
      }))
    }

    return validatedSafes.map((validated: NestedSafeValidation) => {
      const isManuallyHidden = manuallyHiddenSafes.some((hidden) => sameAddress(hidden, validated.address))
      const isUserUnhidden = overriddenAutoHideSafes.some((overridden) => sameAddress(overridden, validated.address))
      // Auto-hidden = invalid AND not overridden by user
      const isAutoHidden = !validated.isValid && !isUserUnhidden

      return {
        address: validated.address,
        isValid: validated.isValid,
        isAutoHidden,
        isManuallyHidden,
        isUserUnhidden,
      }
    })
  }, [validatedSafes, manuallyHiddenSafes, overriddenAutoHideSafes, hasStarted, isLoading, rawNestedSafes])

  const visibleSafes = useMemo(() => {
    return allSafesWithStatus.filter((safe) => !safe.isAutoHidden && !safe.isManuallyHidden)
  }, [allSafesWithStatus])

  const autoHiddenCount = useMemo(() => {
    return allSafesWithStatus.filter((safe) => safe.isAutoHidden).length
  }, [allSafesWithStatus])

  const manuallyHiddenCount = useMemo(() => {
    return allSafesWithStatus.filter((safe) => safe.isManuallyHidden).length
  }, [allSafesWithStatus])

  return {
    allSafesWithStatus,
    visibleSafes,
    autoHiddenCount,
    manuallyHiddenCount,
    isLoading,
    startFiltering,
    hasStarted,
  }
}
