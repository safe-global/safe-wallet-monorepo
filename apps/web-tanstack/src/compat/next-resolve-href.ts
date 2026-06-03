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
import type { UrlObject } from 'url'
import type { NextRouterLike } from './next-router'

type Url = string | UrlObject

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

// Reused call-sites only use the 2-arg `resolveHref(router, href): string` form.
export function resolveHref(_router: NextRouterLike, href: Url): string {
  return toHref(href)
}
