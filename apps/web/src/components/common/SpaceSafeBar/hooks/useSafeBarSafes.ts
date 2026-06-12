import { useMemo } from 'react'
import { useIsQualifiedSafe, useSpaceSafes } from '@/features/spaces'
import { useAllSafes, useAllSafesGrouped, type AllSafeItems } from '@/hooks/safes'
import type { SafeItem } from '@/hooks/safes'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { sameAddress } from '@safe-global/utils/utils/addresses'

/**
 * Returns appropriate safe lists for the SafeBar based on context.
 * - Space context (qualified safe or on a space route): space safes for both
 *   dropdown and chain selector, so the user always sees the current space's
 *   accounts — including when a tx modal is opened from the space-level Actions Tray.
 * - Non-space: pinned safes for dropdown, all known safes for chain selector.
 *
 * The current safe is always injected into both lists so the selector
 * and chain switcher render even when the safe isn't pinned.
 */
export function useSafeBarSafes() {
  const isQualifiedSafe = useIsQualifiedSafe()
  const isSpaceRoute = useIsSpaceRoute()
  const isInSpaceContext = isQualifiedSafe || isSpaceRoute
  const { allSafes: spaceSafes } = useSpaceSafes()
  const urlSafeAddress = useSafeAddressFromUrl()
  const { safeAddress: reduxSafeAddress } = useSafeInfo()
  const safeAddress = urlSafeAddress || reduxSafeAddress
  const currentChainId = useChainId()

  const allSafeItems = useAllSafes()

  const pinnedItems = useMemo(() => allSafeItems?.filter((s) => s.isPinned) ?? [], [allSafeItems])

  const pinnedGrouped = useAllSafesGrouped(pinnedItems)
  const allGrouped = useAllSafesGrouped(allSafeItems ?? [])

  const pinnedSafes = useMemo<AllSafeItems>(() => {
    const multiChainSafes = pinnedGrouped.allMultiChainSafes ?? []
    const singleSafes = pinnedGrouped.allSingleSafes ?? []

    return [...multiChainSafes, ...singleSafes]
  }, [pinnedGrouped.allMultiChainSafes, pinnedGrouped.allSingleSafes])

  const allKnownSafes = useMemo<AllSafeItems>(() => {
    const multiChainSafes = allGrouped.allMultiChainSafes ?? []
    const singleSafes = allGrouped.allSingleSafes ?? []

    return [...multiChainSafes, ...singleSafes]
  }, [allGrouped.allMultiChainSafes, allGrouped.allSingleSafes])

  // Fallback SafeItem for the current safe when it's not in any list
  // (e.g. navigated via URL to a safe that isn't pinned or owned).
  const fallbackCurrentSafe = useMemo<SafeItem | undefined>(() => {
    if (!safeAddress || !currentChainId) return undefined
    return {
      chainId: currentChainId,
      address: safeAddress,
      isReadOnly: true,
      isPinned: false,
      lastVisited: 0,
      name: undefined,
    }
  }, [safeAddress, currentChainId])

  // Current safe: pull from allKnownSafes so the dropdown sees every chain it's
  // deployed on (pinned, owned, or counterfactual); other safes stay pinned-only.
  // Pin state stays decoupled — bookmark drives it, navigating doesn't auto-pin.
  const dropdownSafes = useMemo<AllSafeItems>(() => {
    if (!safeAddress) return pinnedSafes
    const current = allKnownSafes.find((s) => sameAddress(s.address, safeAddress)) ?? fallbackCurrentSafe
    if (!current) return pinnedSafes
    const otherPinned = pinnedSafes.filter((s) => !sameAddress(s.address, safeAddress))
    return [current, ...otherPinned]
  }, [pinnedSafes, allKnownSafes, safeAddress, fallbackCurrentSafe])

  // Same for chain selector.
  const chainSelectorSafes = useMemo<AllSafeItems>(() => {
    if (!safeAddress) return allKnownSafes
    if (allKnownSafes.some((s) => sameAddress(s.address, safeAddress))) return allKnownSafes
    const current = fallbackCurrentSafe
    if (!current) return allKnownSafes
    return [current, ...allKnownSafes]
  }, [allKnownSafes, safeAddress, fallbackCurrentSafe])

  return {
    dropdownSafes: isInSpaceContext ? spaceSafes : dropdownSafes,
    chainSelectorSafes: isInSpaceContext ? spaceSafes : chainSelectorSafes,
    // Expose so the header label stays in sync with which list is shown
    isInSpaceContext,
  }
}
