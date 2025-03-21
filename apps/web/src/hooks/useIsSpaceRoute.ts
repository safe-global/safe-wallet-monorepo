import { usePathname } from 'next/navigation'
import { AppRoutes } from '@/config/routes'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'

const SPACES_ROUTES = [
  AppRoutes.spaces.index,
  AppRoutes.spaces.settings,
  AppRoutes.spaces.members,
  AppRoutes.spaces.safeAccounts,
]

export const useIsSpaceRoute = (): boolean => {
  const clientPathname = usePathname()
  const route = clientPathname || ''
  const spaceId = useCurrentSpaceId()

  return SPACES_ROUTES.includes(route) && !!spaceId
}
