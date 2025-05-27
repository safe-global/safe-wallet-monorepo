import { useMemo } from 'react'
import { isActiveAdmin, isAdmin, useSpaceMembersByStatus } from './useSpaceMembers'
import type { Member } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentMembership } from './useSpaceMembers'

export const useAdminCount = (members?: Member[]) => {
  const { activeMembers } = useSpaceMembersByStatus()
  const membersToUse = members ?? activeMembers
  return useMemo(() => membersToUse.filter(isAdmin).length, [membersToUse])
}

export const useIsLastActiveAdmin = (member?: Member) => {
  const adminCount = useAdminCount()
  const currentMembership = useCurrentMembership()

  const memberToUse = member ?? currentMembership

  return adminCount === 1 && !!memberToUse && isActiveAdmin(memberToUse)
}
