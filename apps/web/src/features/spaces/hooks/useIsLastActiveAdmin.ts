import { useMemo } from 'react'
import { isActiveAdmin, isAdmin, useSpaceMembersByStatus } from './useSpaceMembers'
import type { Member } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentMembership } from './useSpaceMembers'

export const useAdminCount = (members?: Member[]) => {
  const { activeMembers } = useSpaceMembersByStatus()
  const membersToUse = members ?? activeMembers
  return useMemo(() => membersToUse.filter(isAdmin).length, [membersToUse])
}

export const useIsLastActiveAdmin = () => {
  const adminCount = useAdminCount()
  const currentMembership = useCurrentMembership()

  return adminCount === 1 && !!currentMembership && isActiveAdmin(currentMembership)
}
