/**
 * Compatibility shim for `next/navigation` (App-Router-style hooks).
 * Decisions.md (2026-05-22) — cross-workspace next/* shimming. Extends the
 * existing alias set to cover the App Router surface used by reused
 * apps/web/src code (useRouter, usePathname, useSearchParams, useParams).
 *
 * Note that next/navigation's `useRouter` returns a *different* shape from
 * next/router's — no `query`/`pathname`/`asPath`, just navigation methods.
 */
import { useMemo } from 'react'
import {
  useNavigate,
  useRouter as useTanStackRouter,
  useRouterState,
  useParams as useTanStackParams,
} from '@tanstack/react-router'

type AppRouterInstance = {
  push: (href: string) => void
  replace: (href: string) => void
  refresh: () => void
  back: () => void
  forward: () => void
  prefetch: (href: string) => void
}

export function useRouter(): AppRouterInstance {
  const navigate = useNavigate()
  const tsRouter = useTanStackRouter()
  return useMemo(
    () => ({
      push: (href) => void navigate({ to: href }),
      replace: (href) => void navigate({ to: href, replace: true }),
      refresh: () => {
        if (typeof window !== 'undefined') window.location.reload()
      },
      back: () => tsRouter.history.back(),
      forward: () => tsRouter.history.forward(),
      prefetch: () => undefined,
    }),
    [navigate, tsRouter],
  )
}

export function usePathname(): string {
  return useRouterState({ select: (s) => s.location.pathname })
}

export function useSearchParams(): URLSearchParams {
  // Subscribe to the search string primitive instead of the whole location
  // object. `useLocation()` returns a fresh object on every router state
  // tick (~50 per nav), which would create a new URLSearchParams instance
  // each time and cascade through every consumer's useEffect/useCallback
  // deps. Selector subscriptions only wake up when the value changes.
  const searchStr = useRouterState({ select: (s) => s.location.searchStr })
  return useMemo(() => new URLSearchParams(searchStr ?? ''), [searchStr])
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  // `strict: false` is required for matchless usage but TanStack types it loosely;
  // cast through unknown to satisfy the structural-sharing option signature.
  return useTanStackParams({ strict: false } as never) as T
}

export function redirect(_href: string): never {
  throw new Error('next/navigation redirect() is not supported in the SPA target')
}

export function notFound(): never {
  throw new Error('NEXT_NOT_FOUND')
}
