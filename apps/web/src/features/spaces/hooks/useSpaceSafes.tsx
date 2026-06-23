import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  _buildSafeItems,
  type AllSafeItems,
  _getMultiChainAccounts,
  _getSingleChainAccounts,
  getComparator,
} from '@/hooks/safes'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useSpaceSafeOverviews } from './useSpaceSafeOverviews'
import useGetSpaceAddressBook from './useGetSpaceAddressBook'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'
import { mapSpaceContactsToAddressBookState } from '../utils'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { selectAllAddressBooks, selectAllVisitedSafes } from '@/store/slices'
import merge from 'lodash/merge'
import { useMemo } from 'react'
import { isAuthenticated } from '@/store/authSlice'

export const useSpaceSafes = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const {
    currentData,
    isLoading,
    isError: isSpaceSafesError,
    error: spaceSafesError,
    refetch: refetchSpaceSafes,
  } = useSpaceSafesGetV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserSignedIn || !spaceId, ...SPACE_REFRESH_OPTIONS },
  )
  const spaceContacts = useGetSpaceAddressBook()
  const localAddressBook = useAppSelector(selectAllAddressBooks)

  // Space contacts take priority but fall back to the user's address book, so the name used for
  // sorting matches the name actually displayed (the row resolves via the address book too — see
  // useSafeDisplayName). Without the fallback, address-book-named safes have an empty `name` here
  // and "Name" sorting silently no-ops on them.
  const addressBooks = useMemo(
    () => merge({}, localAddressBook, mapSpaceContactsToAddressBookState(spaceContacts)),
    [localAddressBook, spaceContacts],
  )

  // Ownership is derived from the batched overviews this surface already fetches; the pure groupers
  // below avoid pulling in `useAllSafes()`.
  const spaceSafeItems = useMemo(
    () =>
      currentData
        ? Object.entries(currentData.safes).flatMap(([chainId, addresses]) =>
            addresses.map((address) => ({ chainId, address })),
          )
        : [],
    [currentData],
  )
  const { ownedByChain } = useSpaceSafeOverviews(spaceSafeItems)
  const allVisitedSafes = useAppSelector(selectAllVisitedSafes)

  const safeItems = useMemo(
    () => (currentData ? _buildSafeItems(currentData.safes, addressBooks, ownedByChain, allVisitedSafes) : []),
    [currentData, addressBooks, ownedByChain, allVisitedSafes],
  )

  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)

  const allSafes = useMemo<AllSafeItems>(() => {
    const allMultiChainSafes = _getMultiChainAccounts(safeItems)
    const allSingleSafes = _getSingleChainAccounts(safeItems, allMultiChainSafes)
    return [...allMultiChainSafes, ...allSingleSafes].sort(sortComparator)
  }, [safeItems, sortComparator])

  return { allSafes, isLoading, isError: isSpaceSafesError, error: spaceSafesError, refetch: refetchSpaceSafes }
}
