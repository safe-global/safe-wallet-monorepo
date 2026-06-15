import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { _buildSafeItems, type AllSafeItems, useAllSafesGrouped, useAllOwnedSafes, getComparator } from '@/hooks/safes'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import useGetSpaceAddressBook from './useGetSpaceAddressBook'
import { mapSpaceContactsToAddressBookState } from '../utils'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { selectAllAddressBooks, selectAllVisitedSafes } from '@/store/slices'
import merge from 'lodash/merge'
import { useMemo } from 'react'
import { isAuthenticated } from '@/store/authSlice'
import useWallet from '@/hooks/wallets/useWallet'

export const useSpaceSafes = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const {
    currentData,
    isLoading,
    isError: isSpaceSafesError,
    error: spaceSafesError,
    refetch: refetchSpaceSafes,
  } = useSpaceSafesGetV1Query({ spaceId: spaceId ?? '' }, { skip: !isUserSignedIn || !spaceId })
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

  const { address: walletAddress = '' } = useWallet() || {}
  const [allOwned = {}] = useAllOwnedSafes(walletAddress)
  const allVisitedSafes = useAppSelector(selectAllVisitedSafes)
  const safeItems = currentData ? _buildSafeItems(currentData.safes, addressBooks, allOwned, allVisitedSafes) : []
  const safes = useAllSafesGrouped(safeItems)
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)

  const allSafes = useMemo<AllSafeItems>(
    () => [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator),
    [safes.allMultiChainSafes, safes.allSingleSafes, sortComparator],
  )

  return { allSafes, isLoading, isError: isSpaceSafesError, error: spaceSafesError, refetch: refetchSpaceSafes }
}
