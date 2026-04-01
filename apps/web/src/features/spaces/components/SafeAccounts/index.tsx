import AddAccounts from '../AddAccounts'
import EmptySafeAccounts from './EmptySafeAccounts'
import { Stack, Typography } from '@mui/material'
import { useEffect, useState, useMemo, useCallback } from 'react'
import debounce from 'lodash/debounce'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import { selectAllAddressBooks, selectAllVisitedSafes, selectUndeployedSafes } from '@/store/slices'
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
import useWallet from '@/hooks/wallets/useWallet'
import { detectSimilarAddresses } from '@safe-global/utils/utils/addressSimilarity'
import { useSpaceSafes, useIsAdmin, useIsInvited } from '@/features/spaces'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import { SPACE_LABELS } from '@/services/analytics/events/spaces'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import { trackEvent } from '@/services/analytics'
import SearchInput from '../SearchInput'
import AccountsSafesList from './AccountsSafesList'

const _groupAndSort = (
  items: SafeItem[],
  sortComparator: (a: AllSafeItems[number], b: AllSafeItems[number]) => number,
): AllSafeItems => {
  const multi = _getMultiChainAccounts(items)
  const single = _getSingleChainAccounts(items, multi)
  return [...multi, ...single].sort(sortComparator)
}

const SpaceSafeAccounts = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const { allSafes } = useSpaceSafes()
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()

  // Use same organization logic as onboarding
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)
  const { address: walletAddress = '' } = useWallet() || {}
  const [allOwned = {}] = useAllOwnedSafes(walletAddress)
  const allAdded = useAppSelector(selectAllAddedSafes)
  const allUndeployed = useAppSelector(selectUndeployedSafes)
  const allVisitedSafes = useAppSelector(selectAllVisitedSafes)
  const allSafeNames = useAppSelector(selectAllAddressBooks)

  const spaceSafeItems = useMemo(() => {
    const buildItem = (chainId: string, address: string) =>
      _buildSafeItem(chainId, address, walletAddress, allAdded, allOwned, allUndeployed, allVisitedSafes, allSafeNames)

    // Only include safes that are part of the current space
    const spaceSafes = allSafes?.flatMap((item) => ('safes' in item ? item.safes : [item])) || []

    return spaceSafes.map((safe) => buildItem(safe.chainId, safe.address))
  }, [allAdded, allOwned, allUndeployed, walletAddress, allVisitedSafes, allSafeNames, allSafes])

  // Detect similar addresses
  const similarAddresses = useMemo<Set<string>>(() => {
    const uniqueAddresses = [...new Set(spaceSafeItems.map((s) => s.address))]
    if (uniqueAddresses.length < 2) return new Set()
    const result = detectSimilarAddresses(uniqueAddresses)
    return new Set(uniqueAddresses.filter((addr) => result.isFlagged(addr)).map((a) => a.toLowerCase()))
  }, [spaceSafeItems])

  // Group and sort
  const displaySafes = useMemo<AllSafeItems>(
    () => _groupAndSort(spaceSafeItems, sortComparator),
    [spaceSafeItems, sortComparator],
  )

  // Search with debounce
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(setSearchQuery, 300), [])
  const filteredSafes = useSafesSearch(displaySafes, searchQuery)

  const safeList = searchQuery ? filteredSafes : displaySafes
  const hasResults = safeList.length > 0

  useEffect(() => {
    if (searchQuery) {
      trackEvent({ ...SPACE_EVENTS.SEARCH_ACCOUNTS, label: SPACE_LABELS.accounts_page })
    }
  }, [searchQuery])

  return (
    <>
      {isInvited && <PreviewInvite />}
      <Typography variant="h1" mb={3}>
        Safe Accounts
      </Typography>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        gap={2}
        mb={3}
        flexWrap="nowrap"
        flexDirection={{ xs: 'column-reverse', md: 'row' }}
      >
        <SearchInput onSearch={handleSearch} />

        {isAdmin && (
          <Track {...SPACE_EVENTS.ADD_ACCOUNTS_MODAL} label={SPACE_LABELS.accounts_page}>
            <AddAccounts />
          </Track>
        )}
      </Stack>

      {searchQuery && !hasResults ? (
        <Typography variant="h5" fontWeight="normal" mb={2} color="primary.light">
          Found 0 results
        </Typography>
      ) : !hasResults && allSafes && allSafes.length === 0 ? (
        <EmptySafeAccounts />
      ) : (
        <AccountsSafesList safes={safeList} similarAddresses={similarAddresses} />
      )}
    </>
  )
}

export default SpaceSafeAccounts
