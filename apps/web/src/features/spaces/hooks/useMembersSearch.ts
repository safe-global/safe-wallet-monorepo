import { useMemo } from 'react'
import Fuse from 'fuse.js'
import type { Member } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const useMembersSearch = (members: Member[], query: string): Member[] => {
  const fuse = useMemo(
    () =>
      new Fuse(members, {
        keys: [{ name: 'name' }],
        threshold: 0.2,
        findAllMatches: true,
        ignoreLocation: true,
      }),
    [members],
  )

  return useMemo(() => (query ? fuse.search(query).map((result) => result.item) : members), [fuse, query, members])
}

export { useMembersSearch }
