import { createRouter } from '@tanstack/react-router'
import { Route as RootRoute } from './routes/__root'
import { Route as WelcomeRoute } from './routes/welcome'

// Phase 2: code-based routing with one slice route. Phase 3 migrators add
// each remaining route from docs/migration/state/routes.md to this tree.
const routeTree = RootRoute.addChildren([WelcomeRoute])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
