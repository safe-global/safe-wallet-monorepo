import { useUserOrganizationsGetUsersV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
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

const useAllMembers = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { data: currentData } = useUserOrganizationsGetUsersV1Query(
    { orgId: Number(spaceId) },
    { skip: !isUserSignedIn },
  )
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

const useCurrentMembership = () => {
  const allMembers = useAllMembers()
  const { currentData: user } = useUsersGetWithWalletsV1Query()
  return allMembers.find((member) => member.user.id === user?.id)
}

export const useIsAdmin = () => {
  const currentMembership = useCurrentMembership()
  return currentMembership?.role === MemberRole.ADMIN
}

export const useIsInvited = () => {
  const currentMembership = useCurrentMembership()
  return currentMembership?.status === MemberStatus.INVITED
}
