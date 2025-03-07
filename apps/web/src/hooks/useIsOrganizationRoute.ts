import { usePathname } from 'next/navigation'
import { AppRoutes } from '@/config/routes'
import { useCurrentOrgId } from '@/features/organizations/hooks/useCurrentOrgId'

const ORGANIZATION_ROUTES = [
  AppRoutes.organizations.index,
  AppRoutes.organizations.settings,
  AppRoutes.organizations.members,
  AppRoutes.organizations.safeAccounts,
]

export const useIsOrganizationRoute = (): boolean => {
  const clientPathname = usePathname()
  const route = clientPathname || ''
  const orgId = useCurrentOrgId()

  return ORGANIZATION_ROUTES.includes(route) && !!orgId
}
