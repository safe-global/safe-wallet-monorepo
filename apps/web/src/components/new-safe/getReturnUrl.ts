import type { UrlObject } from 'url'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { buildCurrentNextUrl, parseNextUrlForRouter } from '@/utils/nextUrl'

/**
 * Where the Create / Load Safe flows return to when the user cancels or backs
 * out of the first step.
 *
 * If they arrived with a `next` query param (e.g. from a Space via the "Manage
 * accounts" dialog), return to that page. Otherwise — a direct link, or a
 * `next` that fails the same-origin/self-redirect checks — fall back to the
 * Spaces overview.
 */
export const getNewSafeReturnUrl = (next: unknown): UrlObject | string => {
  return parseNextUrlForRouter(next) ?? AppRoutes.welcome.spaces
}

/**
 * The `next` value (the current page URL) to attach when linking into the
 * Create / Load Safe flows, so their Cancel/Back returns to the originating
 * page. Pair with `getNewSafeReturnUrl`, which reads it back.
 *
 * Returns a relative URL string; pass it as a `next` query param (object href
 * for `next/link`, or `?next=<encodeURIComponent(...)>` for a plain anchor).
 */
export const useNewSafeNextParam = (): string => {
  const router = useRouter()
  return buildCurrentNextUrl(router.pathname, router.query)
}
