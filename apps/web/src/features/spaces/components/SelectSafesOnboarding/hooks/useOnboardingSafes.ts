import { useCallback, useMemo, useState } from 'react'
import debounce from 'lodash/debounce'
import { type AllSafeItems, _groupAndSort, getComparator, useSafesSearch } from '@/hooks/safes'
import useAllSafes, { type SafeItem } from '@/hooks/safes/useAllSafes'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { useSimilarityClusters, bandGroupsForList, buildSimilarWarnings } from '@/features/address-poisoning'

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
  const allSafeAddresses = useMemo(() => (allSafes ?? []).map((s) => s.address), [allSafes])
  const { flagged: flaggedAddresses, groupIdByAddress } = useSimilarityClusters(allSafeAddresses)

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
