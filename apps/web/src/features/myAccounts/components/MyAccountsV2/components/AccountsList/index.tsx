import { memo, useEffect, useMemo } from 'react'
import {
  type AllSafeItems,
  type AllSafeItemsGrouped,
  useSafeOrderComparator,
  useSafesSearch,
  useSaveManualOrder,
} from '@/hooks/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useSafeInfo from '@/hooks/useSafeInfo'
import useAddressBook from '@/hooks/useAddressBook'
import { useAppSelector } from '@/store'
import { OrderByOption, selectOrderByPreference, TRUSTED_ORDER_SCOPE } from '@/store/orderByPreferenceSlice'
import { trackEvent, OVERVIEW_EVENTS } from '@/services/analytics'
import { AccountsListView } from '@views/features/myAccounts/components/MyAccountsV2/components/AccountsList/AccountsListView'

import SafeAccountsTable from '../../../SafeAccountsTable'

type AccountsListProps = {
  searchQuery: string
  safes: AllSafeItemsGrouped
  onLinkClick?: () => void
}

const AccountsList = ({ searchQuery, safes, onLinkClick }: AccountsListProps) => {
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = useSafeOrderComparator(TRUSTED_ORDER_SCOPE)
  const saveManualOrder = useSaveManualOrder(TRUSTED_ORDER_SCOPE)

  const { safe: currentSafe, safeAddress } = useSafeInfo()
  const addressBook = useAddressBook()

  const allSafes = useMemo<AllSafeItems>(
    () => [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator),
    [safes.allMultiChainSafes, safes.allSingleSafes, sortComparator],
  )

  const filteredSafes = useSafesSearch(allSafes, searchQuery)

  const pinnedSafes = useMemo<AllSafeItems>(() => allSafes.filter((s) => s.isPinned), [allSafes])

  const currentSafeInList = useMemo(
    () => (safeAddress ? allSafes.find((s) => sameAddress(s.address, safeAddress)) : undefined),
    [allSafes, safeAddress],
  )

  const currentSafeItem = useMemo(
    () =>
      safeAddress
        ? {
            chainId: currentSafe.chainId,
            address: safeAddress,
            isReadOnly: !currentSafeInList,
            isPinned: false,
            lastVisited: -1,
            name: addressBook[safeAddress],
          }
        : undefined,
    [currentSafe.chainId, safeAddress, currentSafeInList, addressBook],
  )

  useEffect(() => {
    if (searchQuery) {
      trackEvent({ category: OVERVIEW_EVENTS.SEARCH.category, action: OVERVIEW_EVENTS.SEARCH.action })
    }
  }, [searchQuery])

  if (searchQuery) {
    return (
      <AccountsListView
        isSearching
        resultCount={filteredSafes.length}
        searchResults={
          <SafeAccountsTable
            items={filteredSafes}
            onLinkClick={onLinkClick}
            sortableColumns={orderBy === OrderByOption.NAME}
          />
        }
        showCurrentSafe={false}
        currentSafeTable={null}
        showPinnedSafes={false}
        pinnedSafesTable={null}
      />
    )
  }

  const showCurrentSafe = safeAddress && currentSafeItem && !currentSafeInList?.isPinned

  return (
    <AccountsListView
      isSearching={false}
      resultCount={filteredSafes.length}
      searchResults={null}
      showCurrentSafe={!!showCurrentSafe}
      currentSafeTable={
        <SafeAccountsTable items={currentSafeItem ? [currentSafeItem] : []} onLinkClick={onLinkClick} />
      }
      showPinnedSafes={pinnedSafes.length > 0}
      pinnedSafesTable={
        <SafeAccountsTable
          items={pinnedSafes}
          onLinkClick={onLinkClick}
          sortableColumns={orderBy === OrderByOption.NAME}
          // Always reorderable: dragging saves the displayed order and switches the sort mode to Manual.
          reorder={{ onReorder: saveManualOrder }}
        />
      }
    />
  )
}

// Memoised so opening the "Manage my account list" modal (state lives in the parent) doesn't re-render the full table.
export default memo(AccountsList)
