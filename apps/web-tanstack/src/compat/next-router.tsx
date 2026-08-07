/**
 * Compatibility shim for `next/router`, delegating to TanStack Router. Reused
 * apps/web/src code imports `next/router`; a Vite alias routes those imports
 * here so they keep working against a router-shaped object.
 */
import { useMemo } from 'react'
import { useNavigate, useRouter as useTanStackRouter } from '@tanstack/react-router'
import { useRenderedPathname, useRenderedSearchStr } from './next-location'
import { parseNextQuery, toNavigateOptions, type Url } from './next-url'

// next router push/replace/prefetch accept (url, as?, options?).
type TransitionOptions = { shallow?: boolean; locale?: string | false; scroll?: boolean }

export interface NextRouterLike {
  pathname: string
  asPath: string
  route: string
  basePath: string
  isReady: boolean
  isFallback: boolean
  isPreview: boolean
  query: Record<string, string | string[]>
  push: (url: Url, as?: Url, options?: TransitionOptions) => Promise<boolean>
  replace: (url: Url, as?: Url, options?: TransitionOptions) => Promise<boolean>
  back: () => void
  forward: () => void
  reload: () => void
  prefetch: (url: Url, as?: Url, options?: TransitionOptions) => Promise<void>
  beforePopState: (cb: () => boolean) => void
  events: {
    on: (event: string, handler: (...args: unknown[]) => void) => void
    off: (event: string, handler: (...args: unknown[]) => void) => void
    emit: (event: string, ...args: unknown[]) => void
  }
}

const noopEvents: NextRouterLike['events'] = {
  on: () => undefined,
  off: () => undefined,
  emit: () => undefined,
}

export function useRouter(): NextRouterLike {
  const navigate = useNavigate()
  const tsRouter = useTanStackRouter()
  // Subscribe to ONLY the specific primitives we expose. `useLocation()`
  // returns a fresh object on every internal router state update which
  // turns this shim into a cascading-re-render bomb: every consumer's
  // useCallback/useEffect depending on `router` reruns ~50 times per
  // navigation, producing the Redux action storm observed in dev. By
  // using `useRouterState({ select })` with primitive selectors, the
  // subscriber only wakes up when the selected value actually changes.
  //
  // Both primitives are bound to the RENDERED matches (see next-location.ts)
  // so pathname/query/asPath swap atomically with the page, like in Next.
  const pathname = useRenderedPathname()
  const searchStr = useRenderedSearchStr()
  const query = useMemo(() => parseNextQuery(searchStr), [searchStr])

  return useMemo<NextRouterLike>(
    () => ({
      pathname,
      asPath: `${pathname}${searchStr}`,
      route: pathname,
      basePath: '',
      isReady: true,
      isFallback: false,
      isPreview: false,
      query,
      push: async (url) => {
        await navigate(toNavigateOptions(url))
        return true
      },
      replace: async (url) => {
        await navigate({ ...toNavigateOptions(url), replace: true })
        return true
      },
      back: () => tsRouter.history.back(),
      forward: () => tsRouter.history.forward(),
      reload: () => {
        if (typeof window !== 'undefined') window.location.reload()
      },
      prefetch: async () => undefined,
      beforePopState: () => undefined,
      events: noopEvents,
    }),
    [navigate, tsRouter, pathname, searchStr, query],
  )
}

export function withRouter<P extends object>(
  Component: React.ComponentType<P & { router: NextRouterLike }>,
): React.FC<P> {
  return function WithRouter(props: P) {
    const router = useRouter()
    return <Component {...props} router={router} />
  }
}

// next's default export is the imperatively-usable singleton router. Reused
// web code reads `router.pathname` off it outside React, so back it with the
// live location.
const router = {
  useRouter,
  withRouter,
  get pathname() {
    return typeof window !== 'undefined' ? window.location.pathname : '/'
  },
  push: async (_url: Url, _as?: Url, _options?: TransitionOptions) => true,
  replace: async (_url: Url, _as?: Url, _options?: TransitionOptions) => true,
  events: noopEvents,
}

export default router

// Re-export the type under its Next name so `import type { NextRouter } from 'next/router'` works.
export type NextRouter = NextRouterLike
