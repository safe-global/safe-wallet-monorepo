/**
 * Compatibility shim for `next/router`, delegating to TanStack Router. Reused
 * apps/web/src code imports `next/router`; a Vite alias routes those imports
 * here so they keep working against a router-shaped object.
 */
import { useMemo } from 'react'
import type { UrlObject } from 'url'
import { useNavigate, useRouter as useTanStackRouter, useRouterState } from '@tanstack/react-router'

// Mirror next's own `Url` type (string | node's UrlObject) so reused web code
// that passes a full UrlObject (host, hostname, numeric query values, ...) or
// next's imported `Url` type type-checks unchanged.
type Url = string | UrlObject

// next router push/replace/prefetch accept (url, as?, options?).
type TransitionOptions = { shallow?: boolean; locale?: string | false; scroll?: boolean }

function toHref(url: Url): string {
  if (typeof url === 'string') return url
  const pathname = url.pathname ?? '/'
  let qs = ''
  if (typeof url.query === 'string') {
    qs = url.query
  } else if (url.query) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(url.query)) {
      if (v == null) continue
      if (Array.isArray(v)) v.forEach((vv) => params.append(k, String(vv)))
      else params.append(k, String(v))
    }
    qs = params.toString()
  }
  const hash = url.hash ? `#${url.hash.replace(/^#/, '')}` : ''
  return `${pathname}${qs ? `?${qs}` : ''}${hash}`
}

function parseQuery(search: string): Record<string, string | string[]> {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const result: Record<string, string | string[]> = {}
  for (const [k, v] of params.entries()) {
    if (k in result) {
      const existing = result[k]
      result[k] = Array.isArray(existing) ? [...existing, v] : [existing as string, v]
    } else {
      result[k] = v
    }
  }
  return result
}

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
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const href = useRouterState({ select: (s) => s.location.href })
  const searchStr = useRouterState({ select: (s) => s.location.searchStr })
  const query = useMemo(() => parseQuery(searchStr ?? ''), [searchStr])

  return useMemo<NextRouterLike>(
    () => ({
      pathname,
      asPath: href,
      route: pathname,
      basePath: '',
      isReady: true,
      isFallback: false,
      isPreview: false,
      query,
      push: async (url) => {
        const next = toHref(url)
        await navigate({ to: next })
        return true
      },
      replace: async (url) => {
        const next = toHref(url)
        await navigate({ to: next, replace: true })
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
    [navigate, tsRouter, pathname, href, query],
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
