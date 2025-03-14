import { useUserOrganizationsGetUsersV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useCurrentOrgId } from './useCurrentOrgId'
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
  const orgId = useCurrentOrgId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { data } = useUserOrganizationsGetUsersV1Query({ orgId: Number(orgId) }, { skip: !isUserSignedIn })
  return data?.members || []
}

export const useOrgMembersByStatus = () => {
  const allMembers = useAllMembers()

  const invitedMembers = allMembers.filter(
    (member) => member.status === MemberStatus.INVITED || member.status === MemberStatus.DECLINED,
  )
  const activeMembers = allMembers.filter((member) => member.status === MemberStatus.ACTIVE)

  return { activeMembers, invitedMembers }
}

const useCurrentMembership = () => {
  const allMembers = useAllMembers()
  const { data: user } = useUsersGetWithWalletsV1Query()
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
