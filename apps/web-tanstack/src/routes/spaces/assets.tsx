import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Route as RootRoute } from '../__root'

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/spaces/assets',
  component: lazyRouteComponent(() => import('@/pages/spaces/assets')),
})
