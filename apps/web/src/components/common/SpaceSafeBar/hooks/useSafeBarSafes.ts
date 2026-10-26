import { useMemo } from 'react'
import { useIsQualifiedSafe, useSpaceSafes, useCurrentSpaceId } from '@/features/spaces'
import {
  _buildMultiChainSafeItem,
  flattenSafeItems,
  useAllSafes,
  useAllSafesGrouped,
  useSafeOrderComparator,
  type AllSafeItems,
} from '@/hooks/safes'
import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'
import { getSpaceOrderScope, TRUSTED_ORDER_SCOPE } from '@/store/orderByPreferenceSlice'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { sameAddress } from '@safe-global/utils/utils/addresses'

/**
 * Orders a dropdown list consistently across space / non-space contexts. Every account is sorted by
 * the chosen comparator, so the current safe keeps its natural position (e.g. mid-list under Name or
 * a custom Manual order); the dropdown scrolls to and highlights it instead of hoisting it. When the
 * current safe is in the list, its entry is swapped for `current` in place — `current` carries the
 * fuller (multi-chain) representation so the row can switch chains even if only one is pinned. It's
 * injected at the top only when it isn't part of the list at all (e.g. a safe opened by URL that
 * isn't trusted / not a space member).
 */
const orderDropdownSafes = (
  items: AllSafeItems,
  safeAddress: string,
  comparator: ReturnType<typeof useSafeOrderComparator>,
  current: SafeItem | MultiChainSafeItem | undefined,
): AllSafeItems => {
  const sorted = items.slice().sort(comparator)
  if (!safeAddress || !current) return sorted
  const index = sorted.findIndex((s) => sameAddress(s.address, safeAddress))
  if (index === -1) return [current, ...sorted]
  return sorted.map((safe, i) => (i === index ? current : safe))
}

/** Adds the chains of `extra` that `safe` doesn't list yet, keeping `safe`'s own chains first. */
const withExtraChains = (
  safe: SafeItem | MultiChainSafeItem,
  extra: SafeItem | MultiChainSafeItem,
): SafeItem | MultiChainSafeItem => {
  const chains = flattenSafeItems([safe])
  const extraChains = flattenSafeItems([extra]).filter((s) => !chains.some((c) => c.chainId === s.chainId))
  return extraChains.length ? _buildMultiChainSafeItem(safe.address, [...chains, ...extraChains]) : safe
}

/**
 * Returns appropriate safe lists for the SafeBar based on context.
 * - Space context (qualified safe or on a space route): space safes for the
 *   dropdown, so the user always sees the current space's accounts — including
 *   when a tx modal is opened from the space-level Actions Tray.
 * - Non-space: pinned safes for the dropdown.
 *
 * The current safe is always injected into the dropdown so the selector renders
 * even when the safe isn't pinned. The chain selector gets the current safe alone.
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

  // Skip the owned-safes enumeration (the captcha-protected owners endpoint): the bar's lists are the
  // space safes (overview-derived) and the trusted/pinned safes (added-safes state), neither of which
  // needs it. Per-row read-only is derived from the overviews in useSpaceSafeSelectorItems instead.
  const allSafeItems = useAllSafes(false)

  const spaceId = useCurrentSpaceId()
  // Trusted (pinned) lists honour the trusted custom order; space lists honour that space's order.
  const trustedComparator = useSafeOrderComparator(TRUSTED_ORDER_SCOPE)
  const spaceComparator = useSafeOrderComparator(spaceId ? getSpaceOrderScope(spaceId) : undefined)

  const pinnedItems = useMemo(() => allSafeItems?.filter((s) => s.isPinned) ?? [], [allSafeItems])

  // Pass fetchOwnedSafes=false too: useAllSafesGrouped still calls useAllSafes internally even when
  // customSafes is supplied, so without this it would re-trigger the owners endpoint.
  const pinnedGrouped = useAllSafesGrouped(pinnedItems, false)
  const allGrouped = useAllSafesGrouped(allSafeItems ?? [], false)

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
    const current = safeAddress
      ? (allKnownSafes.find((s) => sameAddress(s.address, safeAddress)) ?? fallbackCurrentSafe)
      : undefined
    return orderDropdownSafes(pinnedSafes, safeAddress, trustedComparator, current)
  }, [pinnedSafes, allKnownSafes, safeAddress, fallbackCurrentSafe, trustedComparator])

  // Trusted tab: pinned safes only. The current safe is pulled to the front only when it's actually
  // pinned — it's never injected, so a non-trusted active safe never shows up under "Trusted accounts".
  // (The trigger still renders the current safe via the workspace list, which always injects it.)
  const localSafes = useMemo<AllSafeItems>(() => {
    const currentPinned = safeAddress ? pinnedSafes.find((s) => sameAddress(s.address, safeAddress)) : undefined
    return orderDropdownSafes(pinnedSafes, safeAddress, trustedComparator, currentPinned)
  }, [pinnedSafes, safeAddress, trustedComparator])

  // Space context: same ordering rule, applied to the space's safes.
  const spaceDropdownSafes = useMemo<AllSafeItems>(() => {
    const current = safeAddress
      ? (spaceSafes.find((s) => sameAddress(s.address, safeAddress)) ?? fallbackCurrentSafe)
      : undefined
    return orderDropdownSafes(spaceSafes, safeAddress, spaceComparator, current)
  }, [spaceSafes, safeAddress, fallbackCurrentSafe, spaceComparator])

  const knownCurrentSafe = useMemo(
    () => (safeAddress ? allKnownSafes.find((s) => sameAddress(s.address, safeAddress)) : undefined),
    [allKnownSafes, safeAddress],
  )

  // Current safe: trusted + counterfactual chains, or just the current chain
  const chainSelectorSafe = knownCurrentSafe ?? fallbackCurrentSafe

  // Current safe: space + trusted + counterfactual chains
  const spaceChainSelectorSafe = useMemo(() => {
    const spaceSafe = safeAddress ? spaceSafes.find((s) => sameAddress(s.address, safeAddress)) : undefined
    if (!spaceSafe) return undefined
    if (!knownCurrentSafe) return spaceSafe
    return withExtraChains(spaceSafe, knownCurrentSafe)
  }, [spaceSafes, safeAddress, knownCurrentSafe])

  return {
    dropdownSafes: isInSpaceContext ? spaceDropdownSafes : dropdownSafes,
    chainSelectorSafe: isInSpaceContext ? spaceChainSelectorSafe : chainSelectorSafe,
    // Both lists are exposed so the dropdown can offer Workspace | Local tabs:
    // `workspaceSafes` are the current space's safes, `localSafes` the trusted (pinned) ones.
    workspaceSafes: spaceDropdownSafes,
    localSafes,
    // Expose so the header label stays in sync with which list is shown
    isInSpaceContext,
  }
}
