import { useMemo } from 'react'
import { useIsQualifiedSafe, useSpaceSafes } from '@/features/spaces'
import { useAllSafes, useAllSafesGrouped, type AllSafeItems } from '@/hooks/safes'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@safe-global/utils/utils/addresses'

/**
 * Returns appropriate safe lists for the SafeBar based on context.
 * - Space context: space safes for both dropdown and chain selector
 * - Non-space: pinned safes for dropdown, all known safes for chain selector
 *
 * The current safe is always injected into both lists so the selector
 * and chain switcher render even when the safe isn't pinned.
 */
export function useSafeBarSafes() {
  const isInSpaceContext = useIsQualifiedSafe()
  const { allSafes: spaceSafes } = useSpaceSafes()
  const { safeAddress } = useSafeInfo()

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

  // Inject the current safe into pinnedSafes if it's not already there,
  // by finding it in allKnownSafes (which includes all visited safes).
  const dropdownSafes = useMemo<AllSafeItems>(() => {
    if (!safeAddress) return pinnedSafes
    const isInPinned = pinnedSafes.some((s) => sameAddress(s.address, safeAddress))
    if (isInPinned) return pinnedSafes
    const currentSafe = allKnownSafes.find((s) => sameAddress(s.address, safeAddress))
    if (!currentSafe) return pinnedSafes
    return [currentSafe, ...pinnedSafes]
  }, [pinnedSafes, allKnownSafes, safeAddress])

  // Same for chain selector — allKnownSafes usually has it, but be safe.
  const chainSelectorSafes = useMemo<AllSafeItems>(() => {
    if (!safeAddress) return allKnownSafes
    const isInList = allKnownSafes.some((s) => sameAddress(s.address, safeAddress))
    if (isInList) return allKnownSafes
    const currentSafe = dropdownSafes.find((s) => sameAddress(s.address, safeAddress))
    if (!currentSafe) return allKnownSafes
    return [currentSafe, ...allKnownSafes]
  }, [allKnownSafes, dropdownSafes, safeAddress])

  return {
    dropdownSafes: isInSpaceContext ? spaceSafes : dropdownSafes,
    chainSelectorSafes: isInSpaceContext ? spaceSafes : chainSelectorSafes,
  }
}
