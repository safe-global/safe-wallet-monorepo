import { AppRoutes } from '@/config/routes'
import { usePathname } from 'next/navigation'

const ORGANIZATION_ROUTES = [AppRoutes.organizations.dashboard, AppRoutes.organizations.members]

export const useIsOrganizationRoute = (pathname: string): boolean => {
  const clientPathname = usePathname()
  const route = pathname || clientPathname || ''

  return ORGANIZATION_ROUTES.includes(route)
}
