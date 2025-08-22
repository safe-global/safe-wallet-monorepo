import { useAppSelector } from '@/store'
import { type AddressBook, selectAddressBookByChain, selectAllAddressBooks } from '@/store/addressBookSlice'
import { type SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useMemo } from 'react'
import useChainId from '@/hooks/useChainId'
import useGetSpaceAddressBook from '@/features/spaces/hooks/useGetSpaceAddressBook'
import { useSearchParams } from 'next/navigation'

export enum ContactSource {
  space = 'space',
  local = 'local',
}

export type ExtendedContact = SpaceAddressBookItemDto & { source: ContactSource }

const mapLocalToContacts = (addressBook: AddressBook, chainId: string): ExtendedContact[] => {
  return Object.entries(addressBook).map(([address, name]) => ({
    name,
    address,
    chainIds: [chainId],
    createdBy: '',
    lastUpdatedBy: '',
    source: ContactSource.local,
  }))
}

const mapSpaceToContacts = (addressBook: SpaceAddressBookItemDto[]): ExtendedContact[] => {
  if (!addressBook) return []

  return addressBook.map<ExtendedContact>((entry) => ({
    ...entry,
    source: ContactSource.space,
  }))
}

const addressBookKey = (address: string, chainId: string) => `${chainId}:${address.toLowerCase()}`

export type MergedAddressBook = {
  list: ExtendedContact[]
  get: (address: string, chainId: string) => ExtendedContact | undefined
  has: (address: string, chainId: string) => boolean
}

export const useMergedAddressBooks = (chainId?: string): MergedAddressBook => {
  const fallbackChainId = useChainId()
  const actualChainId = chainId ?? fallbackChainId
  const spaceAddressBook = useGetSpaceAddressBook()
  const localAddressBook = useAppSelector((state) => selectAddressBookByChain(state, actualChainId))

  return useMemo<MergedAddressBook>(() => {
    const byKey = new Map<string, ExtendedContact>()

    const spaceContacts = mapSpaceToContacts(spaceAddressBook)
    const localContacts = mapLocalToContacts(localAddressBook, actualChainId)

    for (const spaceContact of spaceContacts) {
      for (const chainId of spaceContact.chainIds) {
        byKey.set(addressBookKey(spaceContact.address, chainId), { ...spaceContact, chainIds: [chainId] })
      }
    }

    for (const localContact of localContacts) {
      const key = addressBookKey(localContact.address, actualChainId)

      if (!byKey.has(key)) {
        byKey.set(key, localContact)
      }
    }

    // Only include local contacts if they don't already exist in the space address book
    const filteredLocal = localContacts.filter(
      (local) =>
        !spaceContacts.some(
          (space) => sameAddress(space.address, local.address) && space.chainIds.includes(actualChainId),
        ),
    )

    const list = [...spaceContacts, ...filteredLocal]
    const get = (address: string, chainId: string) => byKey.get(addressBookKey(address, chainId))
    const has = (address: string, chainId: string) => byKey.has(addressBookKey(address, chainId))

    return { list, get, has }
  }, [actualChainId, localAddressBook, spaceAddressBook])
}

/**
 * Return a name for the given address and chainId either
 * from the local address book or from a space address book
 * @param address
 * @param chainId
 */
export const useAddressBookItem = (address: string, chainId: string | undefined): ExtendedContact | undefined => {
  const searchParams = useSearchParams()
  const querySafe = searchParams.get('safe')
  const { get } = useMergedAddressBooks(chainId)
  const source = querySafe ? 'merged' : 'spaceOnly'

  return useMemo<ExtendedContact | undefined>(() => {
    if (!chainId) return undefined

    if (source === 'merged') {
      return get(address, chainId)
    }

    if (source === 'spaceOnly') {
      const item = get(address, chainId)
      return item?.source === ContactSource.space ? item : undefined
    }

    return undefined
  }, [address, chainId, source, get])
}

// Returns all local address books
const useAllAddressBooks = () => useAppSelector(selectAllAddressBooks)

export default useAllAddressBooks
