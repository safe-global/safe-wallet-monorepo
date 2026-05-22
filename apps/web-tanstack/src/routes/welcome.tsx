/**
 * Slice route migrated end-to-end as the Phase 2 verification target.
 * The page component itself is reused from apps/web/src verbatim — only the
 * routing primitives are rewired.
 */
import { createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import Welcome from '@/pages/welcome'

// Welcome is typed as Next's `NextPage` — strip the Next-specific generics so
// TanStack's RouteComponent signature accepts it.
const WelcomeRoute = Welcome as unknown as () => React.ReactElement

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/welcome',
  component: WelcomeRoute,
})
