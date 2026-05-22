/**
 * Compatibility shim for `next/router`.
 *
 * Decided in docs/migration/state/decisions.md (2026-05-22): cross-workspace
 * Next.js imports inside reused apps/web/src/** code are routed to these
 * shims via Vite aliases so we don't have to rewrite 175 call-sites up front.
 *
 * This delegates to TanStack Router primitives. Phase 3 migrators are expected
 * to gradually replace `useRouter()` with native TanStack hooks; until then
 * this gives a working router-shaped object.
 */
import { useMemo } from 'react'
import { useNavigate, useLocation, useRouter as useTanStackRouter, useRouterState } from '@tanstack/react-router'

type Url = string | { pathname?: string; query?: Record<string, string | string[] | undefined>; hash?: string }

function toHref(url: Url): string {
  if (typeof url === 'string') return url
  const pathname = url.pathname ?? '/'
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(url.query ?? {})) {
    if (v == null) continue
    if (Array.isArray(v)) v.forEach((vv) => params.append(k, String(vv)))
    else params.append(k, String(v))
  }
  const qs = params.toString()
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
  push: (url: Url) => Promise<boolean>
  replace: (url: Url) => Promise<boolean>
  back: () => void
  forward: () => void
  reload: () => void
  prefetch: (url: Url) => Promise<void>
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
  const location = useLocation()
  const tsRouter = useTanStackRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return useMemo<NextRouterLike>(
    () => ({
      pathname,
      asPath: location.href,
      route: pathname,
      basePath: '',
      isReady: true,
      isFallback: false,
      isPreview: false,
      query: parseQuery(location.searchStr ?? ''),
      push: async (url) => {
        const href = toHref(url)
        await navigate({ to: href })
        return true
      },
      replace: async (url) => {
        const href = toHref(url)
        await navigate({ to: href, replace: true })
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
    [navigate, location, tsRouter, pathname],
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

const router = {
  useRouter,
  withRouter,
  push: async (_url: Url) => true,
  replace: async (_url: Url) => true,
  events: noopEvents,
}

export default router

// Re-export the type under its Next name so `import type { NextRouter } from 'next/router'` works.
export type NextRouter = NextRouterLike
