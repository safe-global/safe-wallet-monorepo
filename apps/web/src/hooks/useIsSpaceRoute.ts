import { usePathname } from 'next/navigation'
import { AppRoutes } from '@/config/routes'

const SPACES_ROUTES: string[] = [
  AppRoutes.spaces.index,
  AppRoutes.spaces.settings,
  AppRoutes.spaces.members,
  AppRoutes.spaces.safeAccounts,
  AppRoutes.spaces.addressBook,
]

export const useIsSpaceRoute = (): boolean => {
  const route = usePathname() || ''
  return SPACES_ROUTES.includes(route)
}
