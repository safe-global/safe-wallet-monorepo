import { useCallback, useMemo, useState } from 'react'
import debounce from 'lodash/debounce'
import { type AllSafeItems, _groupAndSort, getComparator, useSafesSearch } from '@/hooks/safes'
import useAllSafes, { type SafeItem } from '@/hooks/safes/useAllSafes'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { useSimilarityClusters } from '@/features/address-poisoning'

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

  // Flag against the combined pool (so an owned safe impersonating a trusted one is caught) but
  // only surface warnings on owned safes — a safe the user trusted at some point is treated as vetted.
  const combinedAddresses = useMemo(
    () => [...trustedSafeItems, ...ownedSafeItems].map((s) => s.address),
    [trustedSafeItems, ownedSafeItems],
  )
  const { flagged: flaggedCombined, groupIdByAddress } = useSimilarityClusters(combinedAddresses)

  const flaggedOwnedAddresses = useMemo<Set<string>>(() => {
    const ownedAddresses = new Set(ownedSafeItems.map((s) => s.address.toLowerCase()))
    return new Set([...flaggedCombined].filter((address) => ownedAddresses.has(address)))
  }, [flaggedCombined, ownedSafeItems])

  // Band only look-alikes that are BOTH owned — a cluster spanning the trusted list (or an address-book
  // anchor) can't be boxed across sections, so its owned member just keeps its per-row ⚠️.
  const ownedSimilarityGroups = useMemo<Map<string, string>>(() => {
    const ownedAddresses = ownedSafeItems.map((s) => s.address.toLowerCase())
    const ownedCountByGroup = new Map<string, number>()
    for (const address of ownedAddresses) {
      const group = groupIdByAddress.get(address)
      if (group) ownedCountByGroup.set(group, (ownedCountByGroup.get(group) ?? 0) + 1)
    }
    const result = new Map<string, string>()
    for (const address of ownedAddresses) {
      const group = groupIdByAddress.get(address)
      if (group && (ownedCountByGroup.get(group) ?? 0) >= 2) result.set(address, group)
    }
    return result
  }, [groupIdByAddress, ownedSafeItems])

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
    flaggedOwnedAddresses,
    ownedSimilarityGroups,
    handleSearch,
    hasNoSafes,
  }
}

export default useOnboardingSafes
