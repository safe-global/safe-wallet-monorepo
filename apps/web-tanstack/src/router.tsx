import { createRouter } from '@tanstack/react-router'
import { Route as RootRoute } from './routes/__root'
import { Route as WelcomeRoute } from './routes/welcome'
import { Route as ImprintRoute } from './routes/imprint'

const routeTree = RootRoute.addChildren([WelcomeRoute, ImprintRoute])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
