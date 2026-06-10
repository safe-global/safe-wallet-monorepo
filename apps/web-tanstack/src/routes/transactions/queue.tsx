import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Route as RootRoute } from '../__root'

// Lazy-load the page module so navigating to other routes doesn't drag
// this page's transitive imports into the initial bundle.
export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/transactions/queue',
  component: lazyRouteComponent(() => import('@/pages/transactions/queue')),
})
