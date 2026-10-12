import { usePathname } from 'next/navigation'
import { AppRoutes } from '@/config/routes'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'

const SPACES_EXACT_ROUTES = [AppRoutes.spaces.index]

const SPACES_PREFIX_ROUTES = [
  AppRoutes.spaces.settings,
  AppRoutes.spaces.members,
  AppRoutes.spaces.plans,
  AppRoutes.spaces.safeAccounts,
  AppRoutes.spaces.addressBook,
  AppRoutes.spaces.security,
  AppRoutes.spaces.activity,
  AppRoutes.spaces.policies,
]

export const useIsSpaceRoute = (): boolean => {
  const clientPathname = usePathname()
  const route = clientPathname || ''
  const spaceId = useUrlSpaceId()

  const isMatch =
    SPACES_EXACT_ROUTES.includes(route) || SPACES_PREFIX_ROUTES.some((r) => route === r || route.startsWith(r + '/'))

  return isMatch && !!spaceId
}
