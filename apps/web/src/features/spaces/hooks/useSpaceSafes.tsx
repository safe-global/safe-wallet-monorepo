import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  _buildSafeItems,
  type AllSafeItems,
  useAllSafesGrouped,
  useAllOwnedSafes,
  getComparator,
  applyCustomOrder,
} from '@/hooks/safes'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import useGetSpaceAddressBook from './useGetSpaceAddressBook'
import { mapSpaceContactsToAddressBookState } from '../utils'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { selectSpaceSafeOrder } from '@/store/safeOrderSlice'
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
  } = useSpaceSafesGetV1Query({ spaceId: Number(spaceId) }, { skip: !isUserSignedIn || !spaceId })
  const spaceContacts = useGetSpaceAddressBook()

  // We are doing this in order to reuse the _buildSafeItems function but only take space contacts into account
  const addressBooks = mapSpaceContactsToAddressBookState(spaceContacts)

  const { address: walletAddress = '' } = useWallet() || {}
  const [allOwned = {}] = useAllOwnedSafes(walletAddress)
  const safeItems = currentData ? _buildSafeItems(currentData.safes, addressBooks, allOwned) : []
  const safes = useAllSafesGrouped(safeItems)
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)
  const customOrder = useAppSelector((state) => selectSpaceSafeOrder(state, spaceId))

  // A saved manual order (per user, per space) takes precedence over the default comparator so
  // every consumer — the accounts page and the dashboard widget — shows the same order.
  const allSafes = useMemo<AllSafeItems>(() => {
    const sorted = [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator)
    return customOrder?.length ? applyCustomOrder(sorted, customOrder) : sorted
  }, [safes.allMultiChainSafes, safes.allSingleSafes, sortComparator, customOrder])

  return { allSafes, isLoading, isError: isSpaceSafesError, error: spaceSafesError, refetch: refetchSpaceSafes }
}
