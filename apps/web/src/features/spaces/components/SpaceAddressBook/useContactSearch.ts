import { useMemo } from 'react'
import Fuse from 'fuse.js'
import type { ContactItem } from '@/features/spaces/components/SpaceAddressBook/Import/ContactsList'

/**
 * Custom hook to filter the address book by a search query.
 *
 * @param contactItems - The contact items
 * @param searchQuery - The string to filter by (address or name).
 * @returns A list of objects matching the search query.
 */
export function useContactSearch(contactItems: ContactItem[], searchQuery: string): ContactItem[] {
  const fuse = useMemo(() => {
    return new Fuse<ContactItem>(contactItems, {
      keys: ['address', 'name'],
      includeScore: true,
      threshold: 0.3,
    })
  }, [contactItems])

  const results = useMemo(() => {
    if (!searchQuery) return contactItems

    return fuse.search(searchQuery).map((result) => result.item)
  }, [searchQuery, contactItems, fuse])

  return results
}
