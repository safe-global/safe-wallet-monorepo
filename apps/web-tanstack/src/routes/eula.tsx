import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/eula',
  component: lazyRouteComponent(() => import('@/pages/eula')),
})
