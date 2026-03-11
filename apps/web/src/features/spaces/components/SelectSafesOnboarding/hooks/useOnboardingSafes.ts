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
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { detectSimilarAddresses } from '@safe-global/utils/utils/addressSimilarity'

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

    // Trusted safes: from addedSafes (user-pinned, stored in localStorage)
    const trusted = allChainIds.flatMap((chainId) =>
      Object.keys(allAdded[chainId] || {}).map((address) => buildItem(chainId, address)),
    )

    // Owned safes: from CGW API + undeployed, excluding safes already in trusted list
    const owned = allChainIds.flatMap((chainId) => {
      const combined = [...new Set([...(allOwned[chainId] || []), ...Object.keys(allUndeployed[chainId] || {})])]
      return combined
        .filter((address) => !trusted.some((t) => t.chainId === chainId && sameAddress(t.address, address)))
        .map((address) => buildItem(chainId, address))
    })

    return { trustedSafeItems: trusted, ownedSafeItems: owned }
  }, [allChainIds, allAdded, allOwned, allUndeployed, walletAddress, allVisitedSafes, allSafeNames])

  // Detect similar addresses across all safes
  const similarAddresses = useMemo<Set<string>>(() => {
    const allItems = [...trustedSafeItems, ...ownedSafeItems]
    const uniqueAddresses = [...new Set(allItems.map((s) => s.address))]
    if (uniqueAddresses.length < 2) return new Set()
    const result = detectSimilarAddresses(uniqueAddresses)
    return new Set(uniqueAddresses.filter((addr) => result.isFlagged(addr)).map((a) => a.toLowerCase()))
  }, [trustedSafeItems, ownedSafeItems])

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

  return {
    trustedSafes: searchQuery ? filteredTrusted : trustedGrouped,
    ownedSafes: searchQuery ? filteredOwned : ownedGrouped,
    similarAddresses,
    handleSearch,
  }
}

export default useOnboardingSafes
