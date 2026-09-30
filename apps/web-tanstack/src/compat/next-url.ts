/**
 * Shared URL helpers for the next/* compatibility shims.
 *
 * Next.js navigation APIs accept `string | UrlObject` hrefs with the query
 * embedded in the string (`/home?safe=eth:0x...`). TanStack Router's
 * `navigate()` does NOT parse a query string out of `to` — the whole string is
 * treated as a pathname. That mostly "worked" by accident (the committed href
 * re-parses correctly), but an unencoded `:` in an inline query trips
 * TanStack's path-param syntax: the href is written to history while router
 * state never transitions, leaving the previous page mounted (observed as the
 * Space dashboard's accounts widget bouncing to /welcome/spaces?safe=...).
 * All shims therefore split hrefs via `toNavigateOptions` and pass `search`
 * and `hash` to `navigate()` explicitly.
 */
import type { UrlObject } from 'url'

export type Url = string | UrlObject

export type NextQuery = Record<string, string | string[]>

/** Parse a Next-style query string; repeated keys become arrays. */
export function parseNextQuery(search: string): NextQuery {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const result: NextQuery = {}
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

/**
 * Serialize a query object Next-style: arrays become repeated keys
 * (`?k=a&k=b`), scalars are stringified. Returns `''` or a `?`-prefixed
 * string, matching TanStack's `stringifySearch` contract.
 *
 * The chain prefix colon in `?safe=` stays raw (`safe=eth:0x...`):
 * URLSearchParams over-encodes it to `%3A` even though `:` is legal in a
 * query string, and apps/web's useAdjustUrl would then rewrite the URL via
 * `history.replaceState` — a visible `%3A` flash on every navigation.
 * Emitting the canonical form directly (same regex as useAdjustUrl) makes
 * that rewrite a no-op.
 */
export function stringifyNextQuery(query: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v == null) continue
    if (Array.isArray(v)) v.forEach((vv) => params.append(k, String(vv)))
    else params.append(k, String(v))
  }
  const qs = params.toString()
  return qs ? `?${qs}`.replace(/([?&]safe=.+?)%3A(?=0x)/g, '$1:') : ''
}

/** Serialize a Next `Url` (string | UrlObject) to a string href. */
export function toHref(url: Url): string {
  if (typeof url === 'string') return url
  const pathname = url.pathname ?? '/'
  let qs = ''
  if (typeof url.query === 'string') {
    qs = url.query ? (url.query.startsWith('?') ? url.query : `?${url.query}`) : ''
  } else if (url.query) {
    qs = stringifyNextQuery(url.query)
  }
  const hash = url.hash ? `#${url.hash.replace(/^#/, '')}` : ''
  return `${pathname}${qs}${hash}`
}

export interface CompatNavigateOptions {
  to: string
  /** `true` preserves the current search (hash-only navigation), an object replaces it. */
  search: NextQuery | true
  hash: string | undefined
}

/**
 * Split a Next `Url` into TanStack `navigate()` options. The query never rides
 * inside `to`; an explicit `search` object replaces the current search params
 * entirely, mirroring Next's `router.push` semantics.
 */
export function toNavigateOptions(url: Url): CompatNavigateOptions {
  const href = toHref(url)
  // Strip the hash first: per URL spec everything after `#` (including `?`)
  // belongs to the fragment.
  const hashIndex = href.indexOf('#')
  const hash = hashIndex === -1 ? undefined : href.slice(hashIndex + 1)
  const base = hashIndex === -1 ? href : href.slice(0, hashIndex)
  const searchIndex = base.indexOf('?')
  const to = searchIndex === -1 ? base : base.slice(0, searchIndex)
  // Hash-only hrefs (`#section`) are relative to the current URL in Next, so
  // keep the current search. Everything else replaces it, clearing when the
  // href carries no query of its own.
  const search = searchIndex === -1 ? (to ? {} : true) : parseNextQuery(base.slice(searchIndex + 1))
  return { to, search, hash }
}
