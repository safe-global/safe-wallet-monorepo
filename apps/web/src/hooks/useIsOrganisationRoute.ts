import { AppRoutes } from '@/config/routes'
import { usePathname } from 'next/navigation'

const ORGANISATION_ROUTES = [AppRoutes.organisations.dashboard, AppRoutes.organisations.members]

export const useIsOrganisationRoute = (pathname: string): boolean => {
  const clientPathname = usePathname()
  const route = pathname || clientPathname || ''

  return ORGANISATION_ROUTES.includes(route)
}
