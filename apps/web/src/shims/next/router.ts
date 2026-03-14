/**
 * Shim for `next/router` — wraps react-router-dom to match the Next.js useRouter() API.
 *
 * Also re-exports the `NextRouter` interface and a singleton `Router` object
 * so that existing code importing `{ type NextRouter }` or `Router` keeps working.
 */
import { useMemo, useRef, useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RouterEvents {
  on(event: string, handler: (...args: unknown[]) => void): void
  off(event: string, handler: (...args: unknown[]) => void): void
  emit(event: string, ...args: unknown[]): void
}

export type TransitionOptions = {
  shallow?: boolean
  locale?: string | false
  scroll?: boolean
  unstable_skipClientCache?: boolean
}

export type UrlObject = {
  pathname?: string
  query?: Record<string, string | string[] | undefined>
  hash?: string
}

export type Url = string | UrlObject

export interface NextRouter {
  route: string
  pathname: string
  query: Record<string, string | string[] | undefined>
  asPath: string
  basePath: string
  isReady: boolean
  isFallback: boolean
  isPreview: boolean
  isLocaleDomain: boolean
  push(url: Url, as?: string, options?: TransitionOptions): Promise<boolean>
  replace(url: Url, as?: string, options?: TransitionOptions): Promise<boolean>
  back(): void
  forward(): void
  reload(): void
  prefetch(url: string): Promise<void>
  beforePopState(cb: (state: unknown) => boolean): void
  events: RouterEvents
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPath(url: Url): string {
  if (typeof url === 'string') return url

  const { pathname = '/', query, hash } = url
  const params = new URLSearchParams()

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue
      if (Array.isArray(value)) {
        for (const v of value) params.append(key, v)
      } else {
        params.set(key, value)
      }
    }
  }

  const search = params.toString()
  const hashStr = hash ? `#${hash}` : ''
  return `${pathname}${search ? '?' + search : ''}${hashStr}`
}

// ---------------------------------------------------------------------------
// Shared event emitter (singleton so Router.events and useRouter().events
// reference the same instance)
// ---------------------------------------------------------------------------

type Listener = (...args: unknown[]) => void

const listeners = new Map<string, Set<Listener>>()

const routerEvents: RouterEvents = {
  on(event: string, handler: Listener) {
    if (!listeners.has(event)) listeners.set(event, new Set())
    listeners.get(event)!.add(handler)
  },
  off(event: string, handler: Listener) {
    listeners.get(event)?.delete(handler)
  },
  emit(event: string, ...args: unknown[]) {
    listeners.get(event)?.forEach((fn) => fn(...args))
  },
}

// ---------------------------------------------------------------------------
// useRouter hook
// ---------------------------------------------------------------------------

export function useRouter(): NextRouter {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const popStateRef = useRef<((state: unknown) => boolean) | null>(null)

  const query = useMemo(() => {
    const q: Record<string, string | string[] | undefined> = {}
    searchParams.forEach((value, key) => {
      const existing = q[key]
      if (existing !== undefined) {
        q[key] = Array.isArray(existing) ? [...existing, value] : [existing, value]
      } else {
        q[key] = value
      }
    })
    return q
  }, [searchParams])

  const pathname = location.pathname
  const search = location.search
  const asPath = pathname + search + location.hash

  const push = useCallback(
    (url: Url, _as?: string, _options?: TransitionOptions): Promise<boolean> => {
      const path = buildPath(url)
      routerEvents.emit('routeChangeStart', path)
      navigate(path)
      routerEvents.emit('routeChangeComplete', path)
      return Promise.resolve(true)
    },
    [navigate],
  )

  const replace = useCallback(
    (url: Url, _as?: string, _options?: TransitionOptions): Promise<boolean> => {
      const path = buildPath(url)
      routerEvents.emit('routeChangeStart', path)
      navigate(path, { replace: true })
      routerEvents.emit('routeChangeComplete', path)
      return Promise.resolve(true)
    },
    [navigate],
  )

  const back = useCallback(() => {
    navigate(-1)
  }, [navigate])

  const forward = useCallback(() => {
    navigate(1)
  }, [navigate])

  const reload = useCallback(() => {
    window.location.reload()
  }, [])

  const prefetch = useCallback((_url: string): Promise<void> => {
    return Promise.resolve()
  }, [])

  const beforePopState = useCallback((cb: (state: unknown) => boolean) => {
    popStateRef.current = cb
  }, [])

  // Register/unregister popstate listener based on the callback ref
  // This is handled via a stable ref so it doesn't cause re-renders
  useMemo(() => {
    if (typeof window === 'undefined') return

    const handler = (e: PopStateEvent) => {
      if (popStateRef.current) {
        const shouldProceed = popStateRef.current(e.state)
        if (!shouldProceed) {
          // Prevent navigation by pushing current state back
          window.history.pushState(null, '', asPath)
        }
      }
    }

    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [asPath])

  const router = useMemo<NextRouter>(
    () => ({
      route: pathname,
      pathname,
      query,
      asPath,
      basePath: '',
      isReady: true,
      isFallback: false,
      isPreview: false,
      isLocaleDomain: false,
      push,
      replace,
      back,
      forward,
      reload,
      prefetch,
      beforePopState,
      events: routerEvents,
    }),
    [pathname, query, asPath, push, replace, back, forward, reload, prefetch, beforePopState],
  )

  return router
}

// ---------------------------------------------------------------------------
// Default export — singleton Router object
// For code that imports `Router` directly (e.g. Router.events.on(...))
// ---------------------------------------------------------------------------

const Router: NextRouter = {
  route: '/',
  pathname: '/',
  query: {},
  asPath: '/',
  basePath: '',
  isReady: true,
  isFallback: false,
  isPreview: false,
  isLocaleDomain: false,
  push: () => Promise.resolve(true),
  replace: () => Promise.resolve(true),
  back: () => {},
  forward: () => {},
  reload: () => window.location.reload(),
  prefetch: () => Promise.resolve(),
  beforePopState: () => {},
  events: routerEvents,
}

export default Router

// Re-export for `import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'`
// which is used in tests — this is a no-op placeholder; tests will need to adapt.
