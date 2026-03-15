/**
 * Shim for `next/navigation` — provides the App Router-style hooks
 * (`useRouter`, `usePathname`, `useParams`, `useSearchParams`)
 * backed by react-router-dom.
 *
 * Note: next/navigation's `useRouter` returns a SIMPLER API than next/router's
 * `useRouter` — only push/replace/back/forward/refresh, no query/pathname/events.
 */
import { useMemo, useCallback } from 'react'
import {
  useLocation,
  useNavigate,
  useParams as useRRParams,
  useSearchParams as useRRSearchParams,
} from 'react-router-dom'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AppRouterInstance {
  push(href: string): void
  replace(href: string): void
  back(): void
  forward(): void
  refresh(): void
  prefetch(href: string): void
}

// ---------------------------------------------------------------------------
// useRouter (next/navigation style — simpler than next/router)
// ---------------------------------------------------------------------------

export function useRouter(): AppRouterInstance {
  const navigate = useNavigate()

  const push = useCallback(
    (href: string) => {
      navigate(href)
    },
    [navigate],
  )

  const replace = useCallback(
    (href: string) => {
      navigate(href, { replace: true })
    },
    [navigate],
  )

  const back = useCallback(() => {
    navigate(-1)
  }, [navigate])
  const forward = useCallback(() => {
    navigate(1)
  }, [navigate])
  const refresh = useCallback(() => {
    window.location.reload()
  }, [])
  const prefetch = useCallback((_href: string) => {}, [])

  return useMemo<AppRouterInstance>(
    () => ({ push, replace, back, forward, refresh, prefetch }),
    [push, replace, back, forward, refresh, prefetch],
  )
}

// ---------------------------------------------------------------------------
// usePathname
// ---------------------------------------------------------------------------

export function usePathname(): string {
  return useLocation().pathname
}

// ---------------------------------------------------------------------------
// useParams — re-export from react-router-dom
//
// next/navigation's useParams returns Record<string, string | string[]>.
// react-router-dom's useParams returns Record<string, string | undefined>.
// The shapes are close enough for all existing usage in this codebase
// (useChainId.ts reads `.safe` and `.chain`).
// ---------------------------------------------------------------------------

export function useParams(): Record<string, string | undefined> {
  return useRRParams()
}

// ---------------------------------------------------------------------------
// useSearchParams — re-export from react-router-dom
//
// next/navigation returns ReadonlyURLSearchParams (a ReadonlyURLSearchParams).
// react-router-dom returns [URLSearchParams, SetURLSearchParams].
// The codebase uses `useSearchParams()` then calls `.get()` on the result,
// so we return just the URLSearchParams object to match Next.js semantics.
// ---------------------------------------------------------------------------

export function useSearchParams(): URLSearchParams {
  const [searchParams] = useRRSearchParams()
  return searchParams
}
