/**
 * Location hooks for the next/* compatibility shims, bound to the RENDERED
 * route rather than the in-flight one.
 *
 * TanStack updates `state.location` at navigation start but swaps
 * `state.matches` (what `<Matches>` actually renders) only once the
 * destination route has loaded its lazy chunk and loaders. Next.js updates
 * `router.query`/`router.pathname` atomically with the page swap, and reused
 * apps/web guards rely on that — e.g. pages/spaces/index.tsx redirects to
 * /welcome/spaces whenever `spaceId` is missing from the query. Reading
 * `state.location` let that guard observe the *destination* query
 * (`?safe=...`) while the spaces page was still mounted, hijacking the
 * navigation. Deriving pathname/search from the leaf committed match swaps
 * both in the same store update as the page itself, restoring Next semantics.
 */
import { useRouterState } from '@tanstack/react-router'
import { stringifyNextQuery } from './next-url'

/** Pathname of the currently rendered route (falls back to the location before the first match). */
export function useRenderedPathname(): string {
  return useRouterState({
    select: (s) => s.matches[s.matches.length - 1]?.pathname ?? s.location.pathname,
  })
}

/**
 * Next-style search string (`''` or `?...`) of the currently rendered route.
 * Returned as a primitive so subscribers only wake when it actually changes.
 */
export function useRenderedSearchStr(): string {
  return useRouterState({
    select: (s) => {
      const leaf = s.matches[s.matches.length - 1]
      return leaf ? stringifyNextQuery(leaf.search) : (s.location.searchStr ?? '')
    },
  })
}
