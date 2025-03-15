import { useCurrentOrgId } from '@/features/organizations/hooks/useCurrentOrgId'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useUserOrganizationsGetUsersV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { MemberRole } from './useOrgMembers'

export const useIsAdmin = () => {
  const orgId = useCurrentOrgId()
  const { currentData: user } = useUsersGetWithWalletsV1Query()
  const { currentData } = useUserOrganizationsGetUsersV1Query({ orgId: Number(orgId) })
  const currentMembership = currentData?.members.find((member) => member.user.id === user?.id)

  return currentMembership?.role === MemberRole.ADMIN
}
