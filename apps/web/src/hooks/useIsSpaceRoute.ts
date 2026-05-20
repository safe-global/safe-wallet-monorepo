import { usePathname } from 'next/navigation'
import { AppRoutes } from '@/config/routes'
import { useAppSelector } from '@/store'
import { lastUsedSpace } from '@/store/authSlice'

const SPACES_ROUTES = [
  AppRoutes.spaces.index,
  AppRoutes.spaces.settings,
  AppRoutes.spaces.members,
  AppRoutes.spaces.safeAccounts,
  AppRoutes.spaces.addressBook,
  AppRoutes.spaces.security,
]

export const useIsSpaceRoute = (): boolean => {
  const clientPathname = usePathname()
  const route = clientPathname || ''
  const spaceId = useAppSelector(lastUsedSpace)

  return SPACES_ROUTES.includes(route) && !!spaceId
}
