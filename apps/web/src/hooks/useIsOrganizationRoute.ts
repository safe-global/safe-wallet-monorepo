import { AppRoutes } from '@/config/routes'
import { usePathname } from 'next/navigation'

export const useIsOrganizationRoute = (): boolean => {
  const clientPathname = usePathname()
  const route = clientPathname || ''

  return route.startsWith(AppRoutes.organizations.index('')) // This will check against /organizations/
}
