import { useCallback, useMemo } from 'react'
import { useSpaceMembersByStatus } from './useSpaceMembers'

/**
 * Resolves a space member's display name by user id. Returns `undefined`
 * for users who are no longer (or never were) members.
 */
export const useMemberNameResolver = (): ((userId: number | undefined) => string | undefined) => {
  const { activeMembers, invitedMembers } = useSpaceMembersByStatus()

  const nameByUserId = useMemo(() => {
    const map = new Map<number, string>()
    for (const member of [...activeMembers, ...invitedMembers]) {
      if (member.name) {
        map.set(member.user.id, member.name)
      }
    }
    return map
  }, [activeMembers, invitedMembers])

  return useCallback(
    (userId: number | undefined) => (userId === undefined ? undefined : nameByUserId.get(userId)),
    [nameByUserId],
  )
}
