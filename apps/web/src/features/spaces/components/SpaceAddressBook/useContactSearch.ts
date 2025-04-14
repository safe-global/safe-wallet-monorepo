import { useMemo } from 'react'
import Fuse from 'fuse.js'
import type { AddressBookState } from '@/store/addressBookSlice'
import type { ContactItem } from '@/features/spaces/components/SpaceAddressBook/Import/ContactsList'
import { flattenAddressBook } from '@/features/spaces/components/SpaceAddressBook/utils'

/**
 * Custom hook to filter the address book by a search query.
 *
 * @param addressBookState - The entire address book state.
 * @param searchQuery - The string to filter by (address or name).
 * @returns A list of objects matching the search query.
 */
export function useContactSearch(addressBookState: AddressBookState, searchQuery: string): ContactItem[] {
  const flattenedAddresses = useMemo<ContactItem[]>(() => {
    return flattenAddressBook(addressBookState)
  }, [addressBookState])

  const fuse = useMemo(() => {
    return new Fuse<ContactItem>(flattenedAddresses, {
      keys: ['address', 'name'],
      includeScore: true,
      threshold: 0.3,
    })
  }, [flattenedAddresses])

  const results = useMemo(() => {
    if (!searchQuery) return flattenedAddresses

    return fuse.search(searchQuery).map((result) => result.item)
  }, [searchQuery, flattenedAddresses, fuse])

  return results
}
