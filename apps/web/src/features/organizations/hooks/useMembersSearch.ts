import { useMemo } from 'react'
import Fuse from 'fuse.js'
import type { UserOrganization } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'

const useMembersSearch = (members: UserOrganization[], query: string): UserOrganization[] => {
  const fuse = useMemo(
    () =>
      new Fuse(members, {
        keys: [{ name: 'user.id' }],
        threshold: 0.2,
        findAllMatches: true,
        ignoreLocation: true,
      }),
    [members],
  )

  return useMemo(() => (query ? fuse.search(query).map((result) => result.item) : members), [fuse, query, members])
}

export { useMembersSearch }
