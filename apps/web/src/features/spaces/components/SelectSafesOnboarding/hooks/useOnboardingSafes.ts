import { useCallback, useMemo, useState } from 'react'
import debounce from 'lodash/debounce'
import { type AllSafeItems, _groupAndSort, getComparator, useSafesSearch } from '@/hooks/safes'
import useAllSafes, { type SafeItem } from '@/hooks/safes/useAllSafes'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { useSimilarityClusters } from '@/features/address-poisoning'

/**
 * Address → cluster id for the look-alikes that share ONE list, so they can be boxed together. A
 * cluster is kept only where ≥2 of its members (counted by distinct address, so a multi-chain safe
 * isn't double-counted) live in the same section; cross-section clusters are dropped here and rely on
 * the per-row ⚠️ instead.
 */
const groupsWithinList = (items: SafeItem[], groupIdByAddress: Map<string, string>): Map<string, string> => {
  const addresses = [...new Set(items.map((item) => item.address.toLowerCase()))]
  const countByGroup = new Map<string, number>()
  for (const address of addresses) {
    const group = groupIdByAddress.get(address)
    if (group) countByGroup.set(group, (countByGroup.get(group) ?? 0) + 1)
  }
  const result = new Map<string, string>()
  for (const address of addresses) {
    const group = groupIdByAddress.get(address)
    if (group && (countByGroup.get(group) ?? 0) >= 2) result.set(address, group)
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

  // Flag against the full pool so a look-alike in EITHER list warns — including a pinned/trusted
  // impostor (WA-2912). No owned-only filter and no anchor exemption in onboarding.
  const combinedAddresses = useMemo(() => (allSafes ?? []).map((s) => s.address), [allSafes])
  const { flagged: flaggedAddresses, groupIdByAddress } = useSimilarityClusters(combinedAddresses)

  // Trusted and owned each band their own same-list clusters; a cluster split across the two sections
  // can't be boxed, so its members fall back to the per-row ⚠️ that flaggedAddresses already provides.
  const trustedSimilarityGroups = useMemo(
    () => groupsWithinList(trustedSafeItems, groupIdByAddress),
    [trustedSafeItems, groupIdByAddress],
  )
  const ownedSimilarityGroups = useMemo(
    () => groupsWithinList(ownedSafeItems, groupIdByAddress),
    [ownedSafeItems, groupIdByAddress],
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
    handleSearch,
    hasNoSafes,
  }
}

export default useOnboardingSafes
