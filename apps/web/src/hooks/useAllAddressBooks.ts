import { useAppSelector } from '@/store'
import { type AddressBook, selectAllAddressBooks } from '@/store/addressBookSlice'
import { type SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useMemo } from 'react'
import useAddressBook from '@/hooks/useAddressBook'
import useChainId from '@/hooks/useChainId'
import useGetSpaceAddressBook from '@/features/spaces/hooks/useGetSpaceAddressBook'

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

const useLocalAddressBook = (chainId: string) => {
  const addressBook = useAddressBook(chainId)

  return useMemo(() => mapAddressBook(addressBook, chainId), [addressBook, chainId])
}

export const useAllMergedAddressBooks = (chainId?: string): ExtendedContact[] => {
  const fallbackChainId = useChainId()
  const actualChainId = chainId ?? fallbackChainId
  const addressBook = useGetSpaceAddressBook()

  const spaceContacts = useMemo<ExtendedContact[]>(() => {
    if (!addressBook) return []

    return addressBook.map<ExtendedContact>((entry) => ({
      ...entry,
      source: ContactSource.space,
    }))
  }, [addressBook])

  const localContacts = useLocalAddressBook(actualChainId)

  return useMemo<ExtendedContact[]>(() => {
    // Only include local contacts if they don't already exist in the space address book
    const filteredLocalContacts = localContacts.filter(
      (localContact) =>
        !spaceContacts.some(
          (spaceContact) =>
            sameAddress(spaceContact.address, localContact.address) && spaceContact.chainIds.includes(actualChainId),
        ),
    )

    return [...spaceContacts, ...filteredLocalContacts]
  }, [localContacts, spaceContacts, actualChainId])
}

/**
 * Return a name for the given address and chainId either
 * from the local address book or from a space address book
 * @param address
 * @param chainId
 */
export const useAddressBookItem = (address: string, chainId: string | undefined) => {
  const allAddressBooks = useAllMergedAddressBooks(chainId)

  return chainId
    ? allAddressBooks.find((entry) => sameAddress(entry.address, address) && entry.chainIds.includes(chainId))
    : undefined
}

const useAllAddressBooks = () => {
  return useAppSelector(selectAllAddressBooks)
}

export default useAllAddressBooks
