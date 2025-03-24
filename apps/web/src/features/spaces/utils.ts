import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import type { UserWithWallets } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { MemberStatus } from '@/features/spaces/hooks/useSpaceMembers'

// TODO: Currently also checks for 404 because the /v1/spaces/<orgId> endpoint does not return 401
export const isUnauthorized = (error: FetchBaseQueryError | SerializedError | undefined) => {
  return error && 'status' in error && (error.status === 401 || error.status === 404)
}

export const filterSpacesByStatus = (
  currentUser: UserWithWallets | undefined,
  spaces: GetSpaceResponse[],
  status: MemberStatus,
) => {
  return spaces.filter((space) => {
    return space.members.some((member) => member.user.id === currentUser?.id && member.status === status)
  })
}

export const getNonDeclinedSpaces = (currentUser: UserWithWallets | undefined, spaces: GetSpaceResponse[]) => {
  const pendingInvites = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.INVITED)
  const activeSpaces = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.ACTIVE)

  return [...pendingInvites, ...activeSpaces]
}
