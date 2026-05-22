import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Route as RootRoute } from '../__root'

// Lazy-load the page so navigating to other routes does not drag this
// page's transitive imports into the initial bundle.
export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/apps/custom',
  component: lazyRouteComponent(() => import('@/pages/apps/custom')),
})
