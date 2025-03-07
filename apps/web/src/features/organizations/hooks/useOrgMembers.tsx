import { useUserOrganizationsGetUsersV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useCurrentOrgId } from './useCurrentOrgId'

export enum MemberStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  DECLINED = 'DECLINED',
}

export const useOrgMembers = () => {
  const orgId = useCurrentOrgId()
  const { data } = useUserOrganizationsGetUsersV1Query({ orgId: Number(orgId) })

  const invitedMembers =
    data?.members.filter(
      (member) => member.status === MemberStatus.INVITED || member.status === MemberStatus.DECLINED,
    ) || []
  const activeMembers = data?.members.filter((member) => member.status === MemberStatus.ACTIVE) || []

  return { activeMembers, invitedMembers }
}
