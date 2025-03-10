import { useUserOrganizationsGetUsersV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useCurrentOrgId } from './useCurrentOrgId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

export enum MemberStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  DECLINED = 'DECLINED',
}

export const useOrgMembers = () => {
  const orgId = useCurrentOrgId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { data } = useUserOrganizationsGetUsersV1Query({ orgId: Number(orgId) }, { skip: !isUserSignedIn })

  const invitedMembers =
    data?.members.filter(
      (member) => member.status === MemberStatus.INVITED || member.status === MemberStatus.DECLINED,
    ) || []
  const activeMembers = data?.members.filter((member) => member.status === MemberStatus.ACTIVE) || []

  return { activeMembers, invitedMembers }
}
