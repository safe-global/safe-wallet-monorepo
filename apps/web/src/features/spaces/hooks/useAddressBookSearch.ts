import { useMemo } from 'react'
import Fuse from 'fuse.js'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const useAddressBookSearch = (contacts: SpaceAddressBookItemDto[], query: string): SpaceAddressBookItemDto[] => {
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
