import { createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import Imprint from '@/pages/imprint'

// Imprint is typed as Next's `NextPage`; strip the generics so TanStack's
// RouteComponent signature accepts it.
const ImprintRoute = Imprint as unknown as () => React.ReactElement

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/imprint',
  component: ImprintRoute,
})
