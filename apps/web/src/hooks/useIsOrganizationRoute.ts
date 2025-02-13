import { AppRoutes } from '@/config/routes'
import { usePathname } from 'next/navigation'

export const useIsOrganizationRoute = (pathname: string): boolean => {
  const clientPathname = usePathname()
  const route = pathname || clientPathname || ''

  return route.startsWith(AppRoutes.organizations.index('')) // This will check against /organizations/
}
