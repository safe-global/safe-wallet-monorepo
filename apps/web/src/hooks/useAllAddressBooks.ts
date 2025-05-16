import { useAppSelector } from '@/store'
import { type AddressBook, selectAllAddressBooks } from '@/store/addressBookSlice'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { isAuthenticated } from '@/store/authSlice'
import {
  type SpaceAddressBookItemDto,
  useAddressBooksGetAddressBookItemsV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useAddressBook from '@/hooks/useAddressBook'
import useChainId from '@/hooks/useChainId'
import { useMemo } from 'react'

export enum ContactSource {
  space = 'space',
  local = 'local',
}
export type ExtendedContact = SpaceAddressBookItemDto & { source: ContactSource }

const mapAddressBook = (addressBook: AddressBook, chainId: string): ExtendedContact[] => {
  return Object.entries(addressBook).map(([address, name]) => ({
    name,
    address,
    chainIds: [chainId],
    createdBy: '',
    lastUpdatedBy: '',
    source: ContactSource.local,
  }))
}

/**
 * Returns the local address book for a specific network
 * in the same structure as the Space address book
 */
const useLocalAddressBook = () => {
  const chainId = useChainId()
  const addressBook = useAddressBook()

  return mapAddressBook(addressBook, chainId)
}

export const useAllMergedAddressBooks = (): ExtendedContact[] => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: addressBook } = useAddressBooksGetAddressBookItemsV1Query(
    { spaceId: Number(spaceId) },
    { skip: !isUserSignedIn },
  )

  const spaceContacts = useMemo<ExtendedContact[]>(() => {
    if (!addressBook) return []

    return addressBook.data.map<ExtendedContact>((entry) => ({
      ...entry,
      source: ContactSource.space,
    }))
  }, [addressBook])

  const localContacts = useLocalAddressBook()

  // Only include local contacts if they don't already exist in the space address book
  return useMemo<ExtendedContact[]>(() => {
    return [
      ...spaceContacts,
      ...localContacts.filter(
        (localContact) =>
          !spaceContacts.some((spaceContact) => sameAddress(spaceContact.address, localContact.address)),
      ),
    ]
  }, [spaceContacts, localContacts])
}

/**
 * Return a name for the given address and chainId either
 * from the local address book or from a space address book
 * @param address
 * @param chainId
 */
export const useAddressBookItem = (address: string, chainId: string | undefined) => {
  const allAddressBooks = useAllMergedAddressBooks()

  return chainId
    ? allAddressBooks.find((entry) => sameAddress(entry.address, address) && entry.chainIds.includes(chainId))
    : undefined
}

const useAllAddressBooks = () => {
  return useAppSelector(selectAllAddressBooks)
}

export default useAllAddressBooks
