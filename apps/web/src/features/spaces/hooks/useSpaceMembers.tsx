import { useMembersGetUsersV1Query, type Member } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from 'src/features/spaces/hooks/useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'

export enum MemberStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  DECLINED = 'DECLINED',
}

export enum MemberRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export const isAdmin = (member: Member) => member.role === MemberRole.ADMIN

export const isActiveAdmin = (member: Member) => isAdmin(member) && member.status === MemberStatus.ACTIVE

const useAllMembers = (spaceId?: number) => {
  const currentSpaceId = useCurrentSpaceId()
  const actualSpaceId = spaceId ?? currentSpaceId
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { data: currentData } = useMembersGetUsersV1Query({ spaceId: Number(actualSpaceId) }, { skip: !isUserSignedIn })
  return currentData?.members || []
}

export const useSpaceMembersByStatus = () => {
  const allMembers = useAllMembers()

  const invitedMembers = allMembers.filter(
    (member) => member.status === MemberStatus.INVITED || member.status === MemberStatus.DECLINED,
  )
  const activeMembers = allMembers.filter((member) => member.status === MemberStatus.ACTIVE)

  return { activeMembers, invitedMembers }
}

export const useCurrentMembership = (spaceId?: number) => {
  const allMembers = useAllMembers(spaceId)
  const { currentData: user } = useUsersGetWithWalletsV1Query()
  return allMembers.find((member) => member.user.id === user?.id)
}

export const useIsActiceMember = (spaceId?: number) => {
  const currentMembership = useCurrentMembership(spaceId)
  return !!currentMembership && currentMembership.status === MemberStatus.ACTIVE
}

export const useIsAdmin = (spaceId?: number) => {
  const currentMembership = useCurrentMembership(spaceId)
  return !!currentMembership && isActiveAdmin(currentMembership)
}

export const useIsInvited = () => {
  const currentMembership = useCurrentMembership()
  return currentMembership?.status === MemberStatus.INVITED
}
