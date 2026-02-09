import { useEffect, useMemo, useRef } from 'react'
import useAllSafes from '@/hooks/safes/useAllSafes'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'

export interface UseMigrationPromptReturn {
  /** Whether to show the prompt (user has safes but none pinned) */
  shouldShowPrompt: boolean
  /** Number of safes available to pin */
  availableSafeCount: number
  /** Whether the user has any pinned safes */
  hasPinnedSafes: boolean
  /** Whether the user has any associated safes */
  hasAssociatedSafes: boolean
  /** Whether data is still loading */
  isLoading: boolean
}

/**
 * Hook to detect if prompt should be shown
 *
 * The prompt shows when:
 * 1. User has associated safes (from API - requires connected wallet)
 * 2. User has no pinned safes (from addedSafesSlice)
 */
const useMigrationPrompt = (): UseMigrationPromptReturn => {
  const allSafes = useAllSafes()

  // Check if user has any pinned safes (using allSafes to stay consistent with rendered list)
  const hasPinnedSafes = useMemo(() => {
    return allSafes?.some((safe) => safe.isPinned) ?? false
  }, [allSafes])

  // Count unique safes by address (safes can exist on multiple chains)
  const availableSafeCount = useMemo(() => {
    if (!allSafes) return 0
    const uniqueAddresses = new Set(allSafes.map((safe) => safe.address.toLowerCase()))
    return uniqueAddresses.size
  }, [allSafes])

  const hasAssociatedSafes = availableSafeCount > 0
  const isLoading = !allSafes

  // Show prompt if user has safes but none pinned
  const shouldShowPrompt = !isLoading && hasAssociatedSafes && !hasPinnedSafes

  // Track when migration prompt is first shown
  const hasTrackedPrompt = useRef(false)
  useEffect(() => {
    if (shouldShowPrompt && !hasTrackedPrompt.current) {
      trackEvent(OVERVIEW_EVENTS.TRUSTED_SAFES_MIGRATION_PROMPT)
      hasTrackedPrompt.current = true
    }
  }, [shouldShowPrompt])

  return {
    shouldShowPrompt,
    availableSafeCount,
    hasPinnedSafes,
    hasAssociatedSafes,
    isLoading,
  }
}

export default useMigrationPrompt
