import { useMemo } from 'react'
import Fuse from 'fuse.js'

const useAddressBookSearch = <T extends { name: string; address: string }>(contacts: T[], query: string): T[] => {
  const fuse = useMemo(
    () =>
      new Fuse(contacts, {
        keys: [{ name: 'name' }, { name: 'address' }],
        threshold: 0.2,
        findAllMatches: true,
        ignoreLocation: true,
      }),
    [contacts],
  )

  return useMemo(() => (query ? fuse.search(query).map((result) => result.item) : contacts), [fuse, query, contacts])
}

export default useAddressBookSearch
