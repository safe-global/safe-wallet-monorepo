import { useEffect, useMemo, useRef } from 'react'
import {
  useAllSafes,
  useAllSafesGrouped,
  flattenSafeItems,
  type AllSafeItems,
  type MultiChainSafeItem,
  type SafeItem,
  type SafeItems,
} from '@/hooks/safes'
import { useIsQualifiedSafe, useSpaceSafes } from '@/features/spaces'
import { useOwnersGetAllSafesByOwnerV2Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getFlaggedSimilarAddressSet } from '@safe-global/utils/utils/addressSimilarity'
import { trackEvent } from '@/services/analytics'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'

// Stable empty-array reference so `useAllSafesGrouped` memo doesn't re-run on each render while loading.
const EMPTY_SAFES: SafeItems = []

/**
 * Assembles the list shown in <AccountsModal />: the user's accounts
 * (locally pinned + EOA-owned via CGW + counterfactual) grouped into
 * "Trusted" and "Other" sections, narrowed by search, with address-
 * poisoning warnings.
 *
 * Pipeline:
 *
 *   useAllSafes()              → flat SafeItems (per chain)
 *     ├───────────────────────────────────────────────┐
 *     ▼                                                 ▼  exclude space members (when isQualifiedSafe)
 *   useAllSafesGrouped()                              otherSafes → useAllSafesGrouped()
 *     ▼                                                 ▼
 *   allItems  (merge, sort by lastVisited)            otherSafeItems  (merge, sort)
 *     ▼  search + isPinned                              ▼  search + !isPinned
 *   trustedItems                                      otherItems
 *
 * Non-obvious design choices:
 *
 *  • Exclusion is scoped to "Other" only. Trusted items derive from the
 *    UNFILTERED list so a pinned safe that's also a space member still
 *    appears under Trusted — matching the Manage trusted Safes modal.
 *
 *  • Exclude BEFORE grouping (for "Other"). A multi-chain safe whose
 *    chains straddle the space boundary gracefully degrades to single-
 *    chain via re-grouping; if we filtered after, we'd have to mutate
 *    the grouped item ourselves.
 *
 *  • "Trusted" = locally pinned in addedSafesSlice, NOT space
 *    membership. A user in a space who never pinned anything sees an
 *    empty Trusted section.
 *
 *  • Similarity is computed on the FULL set. A non-space safe
 *    that resembles a space safe will not be flagged here — known v1
 *    limitation. Revisit if poisoning attacks against space members
 *    surface in production.
 *
 *  • Owned-safes errors are surfaced (not swallowed) so callers can
 *    render a retry notification.
 */
export function useAccountsModalItems({ search, open }: { search: string; open: boolean }) {
  const dispatch = useAppDispatch()
  const allSafes = useAllSafes()
  const { address: walletAddress = '' } = useWallet() || {}
  const { error: ownedSafesError, refetch: refetchOwnedSafes } = useOwnersGetAllSafesByOwnerV2Query(
    { ownerAddress: walletAddress },
    { skip: walletAddress === '' },
  )

  const isQualifiedSafe = useIsQualifiedSafe()
  const { allSafes: spaceSafes, isLoading: spaceSafesLoading } = useSpaceSafes()
  const spaceExclusionKey = useMemo<Set<string> | null>(() => {
    if (!isQualifiedSafe) return null
    return new Set(flattenSafeItems(spaceSafes).map((s) => `${s.chainId}:${s.address.toLowerCase()}`))
  }, [isQualifiedSafe, spaceSafes])

  useEffect(() => {
    if (!open || !ownedSafesError) return
    dispatch(
      showNotification({
        title: 'Failed to load owned safes',
        message: 'Some of your accounts may be missing. Please try again.',
        groupKey: 'owned-safes-fetch-error',
        variant: 'error',
        link: { onClick: () => void refetchOwnedSafes(), title: 'Retry' },
      }),
    )
  }, [open, ownedSafesError, refetchOwnedSafes, dispatch])

  // Workspace exclusion is scoped to "Other Safes" only. A trusted (pinned) safe is an explicit
  // user choice and must stay visible in the Trusted section even when it's a workspace member —
  // otherwise this section silently disagrees with the Manage trusted Safes modal.
  const otherSafes = useMemo(() => {
    if (!allSafes || !isQualifiedSafe) return allSafes
    return allSafes.filter((s) => !spaceExclusionKey?.has(`${s.chainId}:${s.address.toLowerCase()}`))
  }, [allSafes, isQualifiedSafe, spaceExclusionKey])

  const { allSingleSafes, allMultiChainSafes } = useAllSafesGrouped(allSafes ?? EMPTY_SAFES)
  const { allSingleSafes: otherSingleSafes, allMultiChainSafes: otherMultiChainSafes } = useAllSafesGrouped(
    otherSafes ?? EMPTY_SAFES,
  )

  const groupedToItems = (multi: MultiChainSafeItem[] | undefined, single: SafeItems | undefined): AllSafeItems =>
    [...(multi ?? []), ...(single ?? [])].sort((a, b) => (b.lastVisited ?? 0) - (a.lastVisited ?? 0))

  const allItems = useMemo<AllSafeItems>(
    () => groupedToItems(allMultiChainSafes, allSingleSafes),
    [allMultiChainSafes, allSingleSafes],
  )

  const otherSafeItems = useMemo<AllSafeItems>(
    () => groupedToItems(otherMultiChainSafes, otherSingleSafes),
    [otherMultiChainSafes, otherSingleSafes],
  )

  const similarAddresses = useMemo(() => getFlaggedSimilarAddressSet(allItems.map((item) => item.address)), [allItems])

  const matchesSearch = (item: SafeItem | MultiChainSafeItem, query: string): boolean => {
    const name = item.name?.toLowerCase() ?? ''
    const address = item.address.toLowerCase()
    return name.includes(query) || address.includes(query)
  }

  const trustedItems = useMemo<AllSafeItems>(() => {
    const query = search.trim().toLowerCase()
    return allItems.filter((item) => item.isPinned && (!query || matchesSearch(item, query)))
  }, [allItems, search])

  const otherItems = useMemo<AllSafeItems>(() => {
    const query = search.trim().toLowerCase()
    return otherSafeItems.filter((item) => !item.isPinned && (!query || matchesSearch(item, query)))
  }, [otherSafeItems, search])

  // Fire SEARCH analytics once per from-empty search session — re-arms when
  // the user clears the input. Intentional: avoids spamming the endpoint on
  // every keystroke while still capturing that the user searched.
  const searchTracked = useRef(false)
  useEffect(() => {
    if (!search.trim()) {
      searchTracked.current = false
      return
    }
    if (searchTracked.current) return
    const timer = setTimeout(() => {
      trackEvent(OVERVIEW_EVENTS.SEARCH)
      searchTracked.current = true
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  return {
    trustedItems,
    otherItems,
    similarAddresses,
    // In workspace context the exclusion set depends on space safes — show the skeleton
    // until both arrive, otherwise the user briefly sees safes that ARE in the workspace
    // before the filter kicks in (contradicting the "Safes not in this workspace" title).
    isLoading: !allSafes || (isQualifiedSafe && Boolean(spaceSafesLoading)),
    isOwnedSafesError: Boolean(ownedSafesError),
    refetchOwnedSafes,
    isQualifiedSafe,
  }
}
