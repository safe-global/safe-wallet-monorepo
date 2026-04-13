import { useMemo } from 'react'
import { useIsQualifiedSafe, useSpaceSafes } from '@/features/spaces'
import { useAllSafes, useAllSafesGrouped, type AllSafeItems } from '@/hooks/safes'

/**
 * Returns appropriate safe lists for the SafeBar based on context.
 * - Space context: space safes for both dropdown and chain selector
 * - Non-space: pinned safes for dropdown, all known safes for chain selector
 */
export function useSafeBarSafes() {
  const isInSpaceContext = useIsQualifiedSafe()
  const { allSafes: spaceSafes } = useSpaceSafes()

  const allSafeItems = useAllSafes()

  const pinnedItems = useMemo(() => allSafeItems?.filter((s) => s.isPinned) ?? [], [allSafeItems])

  const pinnedGrouped = useAllSafesGrouped(pinnedItems)
  const allGrouped = useAllSafesGrouped(allSafeItems ?? [])

  const pinnedSafes = useMemo<AllSafeItems>(
    () => [...(pinnedGrouped.allMultiChainSafes ?? []), ...(pinnedGrouped.allSingleSafes ?? [])],
    [pinnedGrouped.allMultiChainSafes, pinnedGrouped.allSingleSafes],
  )

  const allKnownSafes = useMemo<AllSafeItems>(
    () => [...(allGrouped.allMultiChainSafes ?? []), ...(allGrouped.allSingleSafes ?? [])],
    [allGrouped.allMultiChainSafes, allGrouped.allSingleSafes],
  )

  return {
    dropdownSafes: isInSpaceContext ? spaceSafes : pinnedSafes,
    chainSelectorSafes: isInSpaceContext ? spaceSafes : allKnownSafes,
  }
}
