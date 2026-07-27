import { useCallback, useMemo, useState } from 'react'
import debounce from 'lodash/debounce'
import { type AllSafeItems, _groupAndSort, getComparator, useSafesSearch } from '@/hooks/safes'
import useAllSafes, { type SafeItem } from '@/hooks/safes/useAllSafes'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { useSimilarityClusters } from '@/features/address-poisoning'
import type { SimilarWarning } from '@/features/myAccounts'

/**
 * Address → cluster id for every look-alike in one list (deduped by address, so a multi-chain safe
 * isn't listed twice). Each list bands its own members: ≥2 in a list read as one group, a lone
 * cross-list member as a single boxed card. The ⚠️ (see buildSimilarWarnings) marks the cross-list case.
 */
const bandGroupsForList = (items: SafeItem[], groupIdByAddress: Map<string, string>): Map<string, string> => {
  const result = new Map<string, string>()
  for (const address of new Set(items.map((item) => item.address.toLowerCase()))) {
    const group = groupIdByAddress.get(address)
    if (group) result.set(address, group)
  }
  return result
}

/**
 * Per-address ⚠️ payload for clusters that span BOTH lists — the case a single band can't box. Each
 * member of such a cluster gets its look-alike peers grouped by list, for the icon's tooltip. Clusters
 * living entirely in one list are boxed by their band and produce no warning here.
 */
const buildSimilarWarnings = (
  trustedItems: SafeItem[],
  ownedItems: SafeItem[],
  groupIdByAddress: Map<string, string>,
): Map<string, SimilarWarning> => {
  const trustedSet = new Set(trustedItems.map((item) => item.address.toLowerCase()))
  const ownedSet = new Set(ownedItems.map((item) => item.address.toLowerCase()))

  const byCluster = new Map<string, { trusted: string[]; owned: string[] }>()
  for (const address of new Set([...trustedSet, ...ownedSet])) {
    const group = groupIdByAddress.get(address)
    if (!group) continue
    const entry = byCluster.get(group) ?? { trusted: [], owned: [] }
    ;(trustedSet.has(address) ? entry.trusted : entry.owned).push(address)
    byCluster.set(group, entry)
  }

  const result = new Map<string, SimilarWarning>()
  for (const { trusted, owned } of byCluster.values()) {
    // Cross-list only: the cluster must reach into both sections.
    if (trusted.length === 0 || owned.length === 0) continue
    for (const address of [...trusted, ...owned]) {
      result.set(address, {
        trusted: trusted.filter((peer) => peer !== address),
        owned: owned.filter((peer) => peer !== address),
      })
    }
  }
  return result
}

const useOnboardingSafes = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)

  const allSafes = useAllSafes()

  const { trustedSafeItems, ownedSafeItems } = useMemo(() => {
    const safes = allSafes ?? []

    // A safe is trusted if it's pinned (added) on ANY chain — then ALL its chains show under
    // trusted, so the same multi-chain safe never appears split across trusted and owned.
    const trustedAddresses = new Set(safes.filter((safe) => safe.isPinned).map((safe) => safe.address.toLowerCase()))
    const isTrusted = (safe: SafeItem) => trustedAddresses.has(safe.address.toLowerCase())

    return {
      trustedSafeItems: safes.filter(isTrusted),
      ownedSafeItems: safes.filter((safe) => !isTrusted(safe)),
    }
  }, [allSafes])

  // Cluster against the full pool so a look-alike in EITHER list is caught — including a pinned/trusted
  // impostor (WA-2912). `flaggedAddresses` (all similar) still gates the select-confirm dialog.
  const combinedAddresses = useMemo(() => (allSafes ?? []).map((s) => s.address), [allSafes])
  const { flagged: flaggedAddresses, groupIdByAddress } = useSimilarityClusters(combinedAddresses)

  // Each list bands all of its own cluster members (≥2 → a group, a lone cross-list member → one card).
  const trustedSimilarityGroups = useMemo(
    () => bandGroupsForList(trustedSafeItems, groupIdByAddress),
    [trustedSafeItems, groupIdByAddress],
  )
  const ownedSimilarityGroups = useMemo(
    () => bandGroupsForList(ownedSafeItems, groupIdByAddress),
    [ownedSafeItems, groupIdByAddress],
  )

  // ⚠️ only where a cluster spans both lists (can't be boxed) — its members point at each other via tooltip.
  const similarWarnings = useMemo(
    () => buildSimilarWarnings(trustedSafeItems, ownedSafeItems, groupIdByAddress),
    [trustedSafeItems, ownedSafeItems, groupIdByAddress],
  )

  // Group into multi-chain / single-chain and sort
  const trustedGrouped = useMemo<AllSafeItems>(
    () => _groupAndSort(trustedSafeItems, sortComparator),
    [trustedSafeItems, sortComparator],
  )
  const ownedGrouped = useMemo<AllSafeItems>(
    () => _groupAndSort(ownedSafeItems, sortComparator),
    [ownedSafeItems, sortComparator],
  )

  // Search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(setSearchQuery, 300), [])
  const filteredTrusted = useSafesSearch(trustedGrouped, searchQuery)
  const filteredOwned = useSafesSearch(ownedGrouped, searchQuery)

  // True only when the user has no safes at all — independent of the search query
  // so a "no matches" filter doesn't masquerade as an empty account.
  const hasNoSafes = trustedSafeItems.length === 0 && ownedSafeItems.length === 0

  return {
    trustedSafes: searchQuery ? filteredTrusted : trustedGrouped,
    ownedSafes: searchQuery ? filteredOwned : ownedGrouped,
    flaggedAddresses,
    trustedSimilarityGroups,
    ownedSimilarityGroups,
    similarWarnings,
    handleSearch,
    hasNoSafes,
  }
}

export default useOnboardingSafes
