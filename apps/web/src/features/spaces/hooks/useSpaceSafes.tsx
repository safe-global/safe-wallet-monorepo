import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { _buildSafeItems, type AllSafeItems, useAllSafesGrouped, useAllOwnedSafes, getComparator } from '@/hooks/safes'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import useGetSpaceAddressBook from './useGetSpaceAddressBook'
import { mapSpaceContactsToAddressBookState } from '../utils'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { useMemo } from 'react'
import { isAuthenticated } from '@/store/authSlice'
import useWallet from '@/hooks/wallets/useWallet'

export const useSpaceSafes = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData, isLoading } = useSpaceSafesGetV1Query({ spaceId: Number(spaceId) }, { skip: !isUserSignedIn })
  const spaceContacts = useGetSpaceAddressBook()

  // We are doing this in order to reuse the _buildSafeItems function but only take space contacts into account
  const addressBooks = mapSpaceContactsToAddressBookState(spaceContacts)

  const { address: walletAddress = '' } = useWallet() || {}
  const [allOwned = {}] = useAllOwnedSafes(walletAddress)
  const safeItems = currentData ? _buildSafeItems(currentData.safes, addressBooks, allOwned) : []
  const safes = useAllSafesGrouped(safeItems)
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)

  const allSafes = useMemo<AllSafeItems>(
    () => [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator),
    [safes.allMultiChainSafes, safes.allSingleSafes, sortComparator],
  )

  return { allSafes, isLoading }
}
