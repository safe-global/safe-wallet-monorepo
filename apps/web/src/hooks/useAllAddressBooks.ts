import { useAppSelector } from '@/store'
import { type AddressBookState, selectAllAddressBooks } from '@/store/addressBookSlice'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { isAuthenticated } from '@/store/authSlice'
import {
  type SpaceAddressBookItemDto,
  useAddressBooksGetAddressBookItemsV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useMemo } from 'react'

export enum ContactSource {
  space = 'space',
  local = 'local',
}
export type ExtendedContact = SpaceAddressBookItemDto & { source: ContactSource }

const mapAllLocalAddressBooks = (allAddressBooks: AddressBookState, chainId?: string): ExtendedContact[] => {
  // There can be duplicates with different names across networks so we need a strategy to select only one
  const itemsByAddress: Record<string, SpaceAddressBookItemDto> = {}

  for (const [addressBookChainId, addressBook] of Object.entries(allAddressBooks ?? {})) {
    for (const [address, name] of Object.entries(addressBook ?? {})) {
      const key = address.toLowerCase()

      if (!itemsByAddress[key]) {
        itemsByAddress[key] = {
          address,
          name,
          chainIds: [addressBookChainId],
          createdBy: '',
          lastUpdatedBy: '',
        }
      } else {
        const existingItem = itemsByAddress[key]
        // If names differ, prefer the first non-empty we saw or the current network one
        if ((!existingItem.name && name) || chainId === addressBookChainId) existingItem.name = name
        if (!existingItem.chainIds.includes(addressBookChainId)) existingItem.chainIds.push(addressBookChainId)
      }
    }
  }

  return Object.values(itemsByAddress).map((item) => ({
    ...item,
    source: ContactSource.local,
  }))
}

/**
 * Returns all local address books in the same structure as the Space address book
 * If there are naming conflicts it defaults to the first name it encounters
 */
const useAllLocalAddressBooks = (chainId?: string) => {
  const allAddressBooks = useAllAddressBooks()

  return useMemo(() => mapAllLocalAddressBooks(allAddressBooks, chainId), [allAddressBooks, chainId])
}

/**
 * Optional chainId in case an address exists on multiple networks locally to decide which name to use
 * @param chainId
 */
export const useAllMergedAddressBooks = (chainId?: string): ExtendedContact[] => {
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

  const localContacts = useAllLocalAddressBooks(chainId)

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
  const allAddressBooks = useAllMergedAddressBooks(chainId)

  return chainId
    ? allAddressBooks.find((entry) => sameAddress(entry.address, address) && entry.chainIds.includes(chainId))
    : undefined
}

const useAllAddressBooks = () => {
  return useAppSelector(selectAllAddressBooks)
}

export default useAllAddressBooks
