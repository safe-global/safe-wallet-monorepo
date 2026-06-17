import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useAllSafes, useAllSafesGrouped, getComparator, type AllSafeItems } from '@/hooks/safes'
import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'
import { useSpaceSafes } from '@/features/spaces'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export interface SafeBarSafes {
  /** Accounts shown in the selector dropdown, current safe pinned to the front. */
  dropdownSafes: AllSafeItems
  /** Accounts shown in the chain selector. */
  chainSelectorSafes: AllSafeItems
  /** True when the bar renders the workspace switcher (space safes), false for the global switcher. */
  isInSpaceContext: boolean
}

/**
 * Orders a dropdown list consistently across space / non-space contexts:
 * the current safe is pinned to the front (a multi-chain current safe renders on top;
 * a single-chain current safe is hidden from the list by SafeDropdownContainer and
 * only shown in the trigger), and every other account is sorted by the chosen comparator.
 */
const orderDropdownSafes = (
  items: AllSafeItems,
  safeAddress: string,
  comparator: ReturnType<typeof getComparator>,
  current: SafeItem | MultiChainSafeItem | undefined,
): AllSafeItems => {
  const rest = (safeAddress ? items.filter((s) => !sameAddress(s.address, safeAddress)) : items)
    .slice()
    .sort(comparator)
  return safeAddress && current ? [current, ...rest] : rest
}

const useCurrentSafeAddress = (): string => {
  const urlSafeAddress = useSafeAddressFromUrl()
  const { safeAddress: reduxSafeAddress } = useSafeInfo()
  return urlSafeAddress || reduxSafeAddress
}

// Fallback SafeItem for the current safe when it's not in any list
// (e.g. navigated via URL to a safe that isn't pinned or owned).
const useFallbackCurrentSafe = (safeAddress: string): SafeItem | undefined => {
  const currentChainId = useChainId()
  return useMemo<SafeItem | undefined>(() => {
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
}

/**
 * Workspace switcher source: both lists are the current space's safes, whose ownership comes from the
 * batched overviews (see `useSpaceSafes`). This path does not depend on `useAllSafes`, so it never
 * enumerates owned safes.
 */
const useWorkspaceBarSafes = (): SafeBarSafes => {
  const { allSafes: spaceSafes } = useSpaceSafes()
  const safeAddress = useCurrentSafeAddress()
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const comparator = useMemo(() => getComparator(orderBy), [orderBy])
  const fallbackCurrentSafe = useFallbackCurrentSafe(safeAddress)

  const dropdownSafes = useMemo<AllSafeItems>(() => {
    const current = safeAddress
      ? (spaceSafes.find((s) => sameAddress(s.address, safeAddress)) ?? fallbackCurrentSafe)
      : undefined
    return orderDropdownSafes(spaceSafes, safeAddress, comparator, current)
  }, [spaceSafes, safeAddress, fallbackCurrentSafe, comparator])

  return { dropdownSafes, chainSelectorSafes: spaceSafes, isInSpaceContext: true }
}

/**
 * Global account switcher source: pinned safes for the dropdown and all known safes for the chain
 * selector. The "all known safes" list is the owned-safes consumer; it only mounts outside a space
 * (via `GlobalSafeBarProvider`).
 */
const useGlobalBarSafes = (): SafeBarSafes => {
  const safeAddress = useCurrentSafeAddress()
  const allSafeItems = useAllSafes()
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const comparator = useMemo(() => getComparator(orderBy), [orderBy])
  const fallbackCurrentSafe = useFallbackCurrentSafe(safeAddress)

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

  // Current safe: pull from allKnownSafes so the dropdown sees every chain it's
  // deployed on (pinned, owned, or counterfactual); other safes stay pinned-only.
  // Pin state stays decoupled — bookmark drives it, navigating doesn't auto-pin.
  const dropdownSafes = useMemo<AllSafeItems>(() => {
    const current = safeAddress
      ? (allKnownSafes.find((s) => sameAddress(s.address, safeAddress)) ?? fallbackCurrentSafe)
      : undefined
    return orderDropdownSafes(pinnedSafes, safeAddress, comparator, current)
  }, [pinnedSafes, allKnownSafes, safeAddress, fallbackCurrentSafe, comparator])

  const chainSelectorSafes = useMemo<AllSafeItems>(() => {
    if (!safeAddress) return allKnownSafes
    if (allKnownSafes.some((s) => sameAddress(s.address, safeAddress))) return allKnownSafes
    if (!fallbackCurrentSafe) return allKnownSafes
    return [fallbackCurrentSafe, ...allKnownSafes]
  }, [allKnownSafes, safeAddress, fallbackCurrentSafe])

  return { dropdownSafes, chainSelectorSafes, isInSpaceContext: false }
}

const SafeBarSafesContext = createContext<SafeBarSafes | null>(null)

/** Supplies the workspace switcher's safe lists (space safes; never enumerates owned safes). */
export const WorkspaceSafeBarProvider = ({ children }: { children: ReactNode }) => {
  const value = useWorkspaceBarSafes()
  return <SafeBarSafesContext.Provider value={value}>{children}</SafeBarSafesContext.Provider>
}

/** Supplies the global account switcher's safe lists (the owned-safes consumer). */
export const GlobalSafeBarProvider = ({ children }: { children: ReactNode }) => {
  const value = useGlobalBarSafes()
  return <SafeBarSafesContext.Provider value={value}>{children}</SafeBarSafesContext.Provider>
}

/**
 * Returns the safe lists for the SafeBar. The source (workspace vs global) is chosen by which
 * provider is mounted above, so consumers don't decide whether to enumerate owned safes.
 */
export function useSafeBarSafes(): SafeBarSafes {
  const context = useContext(SafeBarSafesContext)
  if (!context) {
    throw new Error('useSafeBarSafes must be used within a WorkspaceSafeBarProvider or GlobalSafeBarProvider')
  }
  return context
}

// Exported for unit tests that exercise the source hooks in isolation.
export const _useWorkspaceBarSafes = useWorkspaceBarSafes
export const _useGlobalBarSafes = useGlobalBarSafes
