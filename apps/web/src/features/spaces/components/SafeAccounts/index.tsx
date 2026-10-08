import AddAccountsChooser from '../AddAccountsChooser'
import { useMemo, useState } from 'react'
import { useAppSelector } from '@/store'
import { getSpaceOrderScope, OrderByOption, selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import {
  type AllSafeItems,
  type SafeItem,
  _groupAndSort,
  flattenSafeItems,
  useSafeOrderComparator,
  useSafesSearch,
  useSaveManualOrder,
} from '@/hooks/safes'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { useSimilarityClusters } from '@/features/address-poisoning'
import { useSpaceSafes, useIsInvited, useIsAdmin, useCurrentSpaceId } from '@/features/spaces'
import { SafeAccountsTable } from '@/features/myAccounts'
import SafeListSortToggle from '@/components/common/SafeListSortToggle'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import SpaceSafeContextMenu from './SpaceSafeContextMenu'
import SeatLimitBanner from './SeatLimitBanner'
import { useSeatUpsell } from '../../hooks/useSeatUpsell'
import { countSeats } from '@/utils/spaces'
import { SafeAccountsView } from '@views/features/spaces/components/SafeAccounts/SafeAccountsView'

const ADD_ACCOUNTS_ENTRY_POINT = 'safe_accounts'

const SpaceSafeAccounts = () => {
  const { allSafes, isError: isSpaceSafesError, error: spaceSafesError, refetch: refetchSpaceSafes } = useSpaceSafes()
  const isInvited = useIsInvited()
  const isAdmin = useIsAdmin()
  const spaceId = useCurrentSpaceId()
  const orderScope = spaceId ? getSpaceOrderScope(spaceId) : undefined

  // Use same organization logic as onboarding
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = useSafeOrderComparator(orderScope)
  const saveManualOrder = useSaveManualOrder(orderScope)

  // useSpaceSafes already resolves names via the merged (workspace-priority, local fallback) address
  // book, so flatten those items rather than rebuilding them — rebuilding via buildSafeItem would
  // re-derive the name from the local address book only and drop the workspace name.
  const spaceSafeItems = useMemo<SafeItem[]>(() => flattenSafeItems(allSafes ?? []), [allSafes])

  const spaceSafeAddresses = useMemo(() => spaceSafeItems.map((s) => s.address), [spaceSafeItems])
  const { flagged: similarAddresses, groupIdByAddress: similarityGroups } = useSimilarityClusters(spaceSafeAddresses)

  // Group and sort
  const displaySafes = useMemo<AllSafeItems>(
    () => _groupAndSort(spaceSafeItems, sortComparator),
    [spaceSafeItems, sortComparator],
  )

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 300)
  const filteredSafes = useSafesSearch(displaySafes, debouncedSearchQuery)
  const visibleSafes = debouncedSearchQuery ? filteredSafes : displaySafes

  const isSpaceEmpty = allSafes.length === 0
  const { isSafePro, tierName, limit } = useSeatUpsell()
  const usedSeats = countSeats(spaceSafeAddresses)
  const isAtSeatLimit = isSafePro && limit !== null && usedSeats >= limit

  return (
    <SafeAccountsView
      previewInvite={isInvited && <PreviewInvite />}
      showSeatLimitBanner={isAtSeatLimit}
      renderSeatLimitBanner={(bannerProps) => <SeatLimitBanner {...bannerProps} />}
      seatCounter={isSafePro && limit !== null ? { usedSeats, limit, isAtLimit: isAtSeatLimit, tierName } : undefined}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      renderSortToggle={(toggleProps) => <SafeListSortToggle {...toggleProps} />}
      isAdmin={isAdmin}
      renderAddAccounts={(chooserProps) => (
        <AddAccountsChooser {...chooserProps} entryPoint={ADD_ACCOUNTS_ENTRY_POINT} />
      )}
      isError={isSpaceSafesError}
      errorMessage={spaceSafesError ? getRtkQueryErrorMessage(spaceSafesError) : undefined}
      onRetry={refetchSpaceSafes}
      isEmpty={isSpaceEmpty}
      hasResults={visibleSafes.length > 0}
      hasSimilarAddresses={similarAddresses.size > 0}
      table={
        <SafeAccountsTable
          items={visibleSafes}
          // The table sits directly on the page background here, so the card outline is dropped.
          bordered={false}
          // Inside a workspace every Safe belongs to it, so the Workspaces column adds no information.
          columns={['name', 'threshold', 'networks', 'pending', 'balance', 'actions']}
          similarityGroups={similarityGroups}
          // Column sorting is only offered in Name mode; Last visited / Manual own the order.
          sortableColumns={orderBy === OrderByOption.NAME}
          renderActions={(line) => (line.variant === 'child' ? null : <SpaceSafeContextMenu safeItem={line.source} />)}
          // Reorderable in every sort mode; suppressed while searching, where a drop would persist
          // only the filtered subset.
          reorder={!debouncedSearchQuery && orderScope ? { onReorder: saveManualOrder } : undefined}
        />
      }
    />
  )
}

export default SpaceSafeAccounts
