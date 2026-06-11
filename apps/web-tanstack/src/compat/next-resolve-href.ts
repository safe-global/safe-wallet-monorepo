/**
 * Compatibility shim for `next/dist/client/resolve-href`.
 *
 * Reused web code (SafeAppCard, useShareSafeAppUrl) calls
 * `resolveHref(router, urlObject)` to serialise a UrlObject to a string href.
 * Next's real signature wants a full `NextRouter`; our `next/router` shim
 * exposes the narrower `NextRouterLike`. The router argument only carries
 * basePath/locale, which this SPA target doesn't use, so we ignore it and
 * serialise the href directly.
 */
import type { NextRouterLike } from './next-router'
import { toHref, type Url } from './next-url'

// Reused call-sites only use the 2-arg `resolveHref(router, href): string` form.
export function resolveHref(_router: NextRouterLike, href: Url): string {
  return toHref(href)
}
