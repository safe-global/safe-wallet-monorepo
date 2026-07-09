import { useCallback, useMemo, useState } from 'react'
import debounce from 'lodash/debounce'
import {
  type AllSafeItems,
  type SafeItem,
  _buildSafeItem,
  _getMultiChainAccounts,
  _getSingleChainAccounts,
  getComparator,
  useAllOwnedSafes,
  useSafesSearch,
} from '@/hooks/safes'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import { selectAllAddressBooks, selectAllVisitedSafes, selectUndeployedSafes } from '@/store/slices'
import useWallet from '@/hooks/wallets/useWallet'
import useChains from '@/hooks/useChains'
import { getFlaggedSimilarAddressSet, normalizeAddress } from '@safe-global/utils/utils/addressSimilarity'
import { useListSimilarities } from '@/features/address-poisoning'

const _groupAndSort = (
  items: SafeItem[],
  sortComparator: (a: AllSafeItems[number], b: AllSafeItems[number]) => number,
): AllSafeItems => {
  const multi = _getMultiChainAccounts(items)
  const single = _getSingleChainAccounts(items, multi)
  return [...multi, ...single].sort(sortComparator)
}

const useOnboardingSafes = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)

  const { address: walletAddress = '' } = useWallet() || {}
  const [allOwned = {}] = useAllOwnedSafes(walletAddress)
  const { configs } = useChains()
  const allAdded = useAppSelector(selectAllAddedSafes)
  const allUndeployed = useAppSelector(selectUndeployedSafes)
  const allVisitedSafes = useAppSelector(selectAllVisitedSafes)
  const allSafeNames = useAppSelector(selectAllAddressBooks)

  const allChainIds = useMemo(() => configs.map((c) => c.chainId), [configs])

  const { trustedSafeItems, ownedSafeItems } = useMemo(() => {
    const buildItem = (chainId: string, address: string) =>
      _buildSafeItem(chainId, address, walletAddress, allAdded, allOwned, allUndeployed, allVisitedSafes, allSafeNames)

    // Trust is address-level (consistent with the main app's `some`-of-chains pin state): if a Safe
    // address is pinned on ANY chain, every chain of that address is trusted. This avoids the same
    // multichain Safe being split across the trusted + owned sections (which also mis-triggered a
    // look-alike flag on its own other-chain instances).
    const trustedAddresses = new Set(
      allChainIds.flatMap((chainId) => Object.keys(allAdded[chainId] || {}).map((a) => a.toLowerCase())),
    )

    // Every Safe instance the user has, across chains (added ∪ owned ∪ undeployed).
    const allInstances = allChainIds.flatMap((chainId) => {
      const addresses = new Set([
        ...Object.keys(allAdded[chainId] || {}),
        ...(allOwned[chainId] || []),
        ...Object.keys(allUndeployed[chainId] || {}),
      ])
      return [...addresses].map((address) => buildItem(chainId, address))
    })

    const trusted = allInstances.filter((item) => trustedAddresses.has(item.address.toLowerCase()))
    const owned = allInstances.filter((item) => !trustedAddresses.has(item.address.toLowerCase()))

    return { trustedSafeItems: trusted, ownedSafeItems: owned }
  }, [allChainIds, allAdded, allOwned, allUndeployed, walletAddress, allVisitedSafes, allSafeNames])

  const allAddresses = useMemo(
    () => [...trustedSafeItems, ...ownedSafeItems].map((s) => s.address),
    [trustedSafeItems, ownedSafeItems],
  )

  // Legacy intra-list flags plus anchor detection (front OR back vs a trusted anchor) layered on
  // top — flag-gated by ADDRESS_POISONING_PROTECTION (empty map when off). Both the impostor and
  // an in-list imitated anchor are marked so the pair reads side-by-side.
  const anchorAnnotations = useListSimilarities(allAddresses)
  const similarAddresses = useMemo<Set<string>>(() => {
    const flagged = getFlaggedSimilarAddressSet(allAddresses)
    const imitated = new Set<string>()
    anchorAnnotations.forEach((annotation) => {
      if (annotation.match) {
        flagged.add(annotation.address.toLowerCase())
        imitated.add(annotation.match.anchor)
      }
    })
    for (const address of allAddresses) {
      if (imitated.has(normalizeAddress(address))) flagged.add(address.toLowerCase())
    }
    return flagged
  }, [allAddresses, anchorAnnotations])

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
    similarAddresses,
    handleSearch,
    hasNoSafes,
  }
}

export default useOnboardingSafes
