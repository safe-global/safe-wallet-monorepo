import { useEffect } from 'react'
import { act, render, screen } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from '@tanstack/react-router'
import { parseNextQuery, stringifyNextQuery } from './next-url'
import { useRouter, type NextRouterLike } from './next-router'

// Regression for the Space dashboard accounts widget: pushing a string href
// with an inline query whose value contains an unencoded colon
// (`/home?safe=matic:0x...`) wrote the URL to history but never transitioned
// router state, so the still-mounted /spaces page redirected to
// /welcome/spaces. The shim must split the href into `to` + `search`.
const SAFE_PARAM = 'matic:0x245C153cBa7b65d01706B09a30dEf30190Da1878'

let capturedRouter: NextRouterLike | undefined

const CaptureRouter = ({ label }: { label: string }) => {
  capturedRouter = useRouter()
  return <div>{label}</div>
}

// Mirror the app router's config (trailingSlash + Next-style search serializers).
const buildTestRouter = (initialEntry: string) => {
  const rootRoute = createRootRoute({})
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/home',
    component: () => <CaptureRouter label="home page" />,
  })
  const spacesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/spaces',
    component: () => <CaptureRouter label="spaces page" />,
  })
  return createRouter({
    routeTree: rootRoute.addChildren([homeRoute, spacesRoute]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    trailingSlash: 'never',
    parseSearch: parseNextQuery,
    stringifySearch: stringifyNextQuery,
  })
}

describe('next-router compat push/replace', () => {
  beforeEach(() => {
    capturedRouter = undefined
  })

  it('navigates for a string href with an inline query containing a raw colon', async () => {
    const router = buildTestRouter('/spaces?spaceId=abc-123')
    render(<RouterProvider router={router} />)
    expect(await screen.findByText('spaces page')).toBeInTheDocument()

    await act(async () => {
      await capturedRouter!.push(`/home?safe=${SAFE_PARAM}`)
    })

    expect(await screen.findByText('home page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/home')
    expect(capturedRouter!.pathname).toBe('/home')
    expect(capturedRouter!.query).toEqual({ safe: SAFE_PARAM })
  })

  it('navigates for an object href with pathname and query', async () => {
    const router = buildTestRouter('/spaces?spaceId=abc-123')
    render(<RouterProvider router={router} />)
    expect(await screen.findByText('spaces page')).toBeInTheDocument()

    await act(async () => {
      await capturedRouter!.push({ pathname: '/home', query: { safe: SAFE_PARAM } })
    })

    expect(await screen.findByText('home page')).toBeInTheDocument()
    expect(capturedRouter!.query).toEqual({ safe: SAFE_PARAM })
  })

  it('replaces the current query instead of merging it', async () => {
    const router = buildTestRouter('/spaces?spaceId=abc-123')
    render(<RouterProvider router={router} />)
    expect(await screen.findByText('spaces page')).toBeInTheDocument()

    await act(async () => {
      await capturedRouter!.push(`/home?safe=${SAFE_PARAM}`)
    })

    expect(capturedRouter!.query).not.toHaveProperty('spaceId')
  })

  it('does not expose the destination query to the still-mounted page while the route loads', async () => {
    // Regression: TanStack flips `state.location` at navigation start but only
    // swaps the rendered matches once the destination's lazy chunk resolves.
    // Reading `state.location` let pages/spaces/index.tsx observe `?safe=...`
    // (no spaceId) while still mounted, hijacking the navigation with a
    // redirect to /welcome/spaces. pathname/query must swap with the page.
    const queriesSeenBySpacesPage: Array<Record<string, string | string[]>> = []
    let resolveHomeChunk: (() => void) | undefined

    const rootRoute = createRootRoute({})
    const spacesRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/spaces',
      component: function SpacesPage() {
        const router = useRouter()
        capturedRouter = router
        useEffect(() => {
          queriesSeenBySpacesPage.push(router.query)
        }, [router.query])
        return <div>spaces page</div>
      },
    })
    const homeRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/home',
      component: lazyRouteComponent(
        () =>
          new Promise<{ default: () => React.JSX.Element }>((resolve) => {
            resolveHomeChunk = () => resolve({ default: () => <div>home page</div> })
          }),
      ),
    })
    const router = createRouter({
      routeTree: rootRoute.addChildren([spacesRoute, homeRoute]),
      history: createMemoryHistory({ initialEntries: [`/spaces?spaceId=abc-123`] }),
      trailingSlash: 'never',
      parseSearch: parseNextQuery,
      stringifySearch: stringifyNextQuery,
    })
    render(<RouterProvider router={router} />)
    expect(await screen.findByText('spaces page')).toBeInTheDocument()

    // Navigate while the destination chunk is unresolved — the navigation
    // promise stays pending, so don't await it yet.
    let pushPromise: Promise<boolean> | undefined
    await act(async () => {
      pushPromise = capturedRouter!.push(`/home?safe=${SAFE_PARAM}`)
      // Let any (buggy) intermediate re-renders and effects flush.
      await new Promise((resolve) => setTimeout(resolve, 20))
    })

    expect(screen.getByText('spaces page')).toBeInTheDocument()
    expect(queriesSeenBySpacesPage).toEqual([{ spaceId: 'abc-123' }])

    await act(async () => {
      resolveHomeChunk!()
      await pushPromise
    })

    expect(await screen.findByText('home page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/home')
    // The spaces page never observed the destination query.
    expect(queriesSeenBySpacesPage).toEqual([{ spaceId: 'abc-123' }])
  })

  it('replace() navigates without growing the history stack', async () => {
    const router = buildTestRouter('/spaces?spaceId=abc-123')
    render(<RouterProvider router={router} />)
    expect(await screen.findByText('spaces page')).toBeInTheDocument()

    await act(async () => {
      await capturedRouter!.replace(`/home?safe=${SAFE_PARAM}`)
    })

    expect(await screen.findByText('home page')).toBeInTheDocument()
    expect(router.history.length).toBe(1)
  })
})
