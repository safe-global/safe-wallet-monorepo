import { useCurrentOrgId } from '@/features/organizations/hooks/useCurrentOrgId'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useUserOrganizationsGetUsersV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { MemberRole } from '@/features/organizations/components/AddMembersModal'

export const useIsAdmin = () => {
  const orgId = useCurrentOrgId()
  const { data: user } = useUsersGetWithWalletsV1Query()
  const { data } = useUserOrganizationsGetUsersV1Query({ orgId: Number(orgId) })
  const currentMembership = data?.members.find((member) => member.user.id === user?.id)

  return currentMembership?.role === MemberRole.ADMIN
}
