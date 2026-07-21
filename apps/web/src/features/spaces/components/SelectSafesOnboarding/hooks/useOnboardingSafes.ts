import { useCallback, useMemo, useState } from 'react'
import debounce from 'lodash/debounce'
import {
  type AllSafeItems,
  _buildSafeItem,
  _groupAndSort,
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
import { useSimilarityClusters } from '@/features/address-poisoning'

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

    // A safe is trusted if it's added/pinned on ANY chain — then ALL its chains show under trusted,
    // so the same multi-chain safe never appears split across trusted and owned.
    const trustedAddresses = new Set(
      allChainIds.flatMap((chainId) => Object.keys(allAdded[chainId] || {})).map((address) => address.toLowerCase()),
    )

    // Trusted safes: every chain instance (owned + undeployed + added) whose address is trusted anywhere.
    const trusted = allChainIds.flatMap((chainId) => {
      const chainAddresses = [
        ...new Set([
          ...(allOwned[chainId] || []),
          ...Object.keys(allUndeployed[chainId] || {}),
          ...Object.keys(allAdded[chainId] || {}),
        ]),
      ]
      return chainAddresses
        .filter((address) => trustedAddresses.has(address.toLowerCase()))
        .map((address) => buildItem(chainId, address))
    })

    // Owned safes: from CGW API + undeployed, excluding any address trusted on any chain.
    const owned = allChainIds.flatMap((chainId) => {
      const combined = [...new Set([...(allOwned[chainId] || []), ...Object.keys(allUndeployed[chainId] || {})])]
      return combined
        .filter((address) => !trustedAddresses.has(address.toLowerCase()))
        .map((address) => buildItem(chainId, address))
    })

    return { trustedSafeItems: trusted, ownedSafeItems: owned }
  }, [allChainIds, allAdded, allOwned, allUndeployed, walletAddress, allVisitedSafes, allSafeNames])

  // Flag against the combined pool (so an owned safe impersonating a trusted one is caught) but
  // only surface warnings on owned safes — a safe the user trusted at some point is treated as vetted.
  const combinedAddresses = useMemo(
    () => [...trustedSafeItems, ...ownedSafeItems].map((s) => s.address),
    [trustedSafeItems, ownedSafeItems],
  )
  const flaggedCombined = useSimilarityClusters(combinedAddresses).flagged
  const flaggedOwnedAddresses = useMemo<Set<string>>(() => {
    const ownedAddresses = new Set(ownedSafeItems.map((s) => s.address.toLowerCase()))
    return new Set([...flaggedCombined].filter((address) => ownedAddresses.has(address)))
  }, [flaggedCombined, ownedSafeItems])

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
    handleSearch,
    hasNoSafes,
  }
}

export default useOnboardingSafes
