import { usePathname } from 'next/navigation'
import { AppRoutes } from '@/config/routes'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'

const ORGANIZATION_ROUTES = [
  AppRoutes.spaces.index,
  AppRoutes.spaces.settings,
  AppRoutes.spaces.members,
  AppRoutes.spaces.safeAccounts,
]

export const useIsSpaceRoute = (): boolean => {
  const clientPathname = usePathname()
  const route = clientPathname || ''
  const spaceId = useCurrentSpaceId()

  return ORGANIZATION_ROUTES.includes(route) && !!spaceId
}
