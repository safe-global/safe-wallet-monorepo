import AddAccounts from '../AddAccounts'
import EmptySafeAccounts from './EmptySafeAccounts'
import { Stack, Typography } from '@mui/material'
import { useEffect, useState, useMemo } from 'react'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
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
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { TriangleAlert, RotateCw } from 'lucide-react'
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
  const [rawSearchQuery, setRawSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(rawSearchQuery, 300)
  const { allSafes, isError: isSpaceSafesError, error: spaceSafesError, refetch: refetchSpaceSafes } = useSpaceSafes()
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

  const filteredSafes = useSafesSearch(displaySafes, debouncedSearchQuery)

  const safeList = debouncedSearchQuery ? filteredSafes : displaySafes
  const hasResults = safeList.length > 0

  useEffect(() => {
    if (debouncedSearchQuery) {
      trackEvent({ ...SPACE_EVENTS.SEARCH_ACCOUNTS, label: SPACE_LABELS.accounts_page })
    }
  }, [debouncedSearchQuery])

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
        <SearchInput onSearch={setRawSearchQuery} />

        {isAdmin && (
          <Track {...SPACE_EVENTS.ADD_ACCOUNTS_MODAL} label={SPACE_LABELS.accounts_page}>
            <AddAccounts />
          </Track>
        )}
      </Stack>

      {isSpaceSafesError ? (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4">
          <TriangleAlert className="size-5 shrink-0 text-destructive" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-destructive">Failed to load Safe accounts</span>
            <span className="text-xs text-muted-foreground">
              {spaceSafesError ? getRtkQueryErrorMessage(spaceSafesError) : 'Please try again.'}
            </span>
          </div>
          <button
            onClick={refetchSpaceSafes}
            className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
            type="button"
          >
            <RotateCw className="size-3.5" />
            Retry
          </button>
        </div>
      ) : debouncedSearchQuery && !hasResults ? (
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
