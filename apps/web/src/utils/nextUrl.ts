// Paths whose only job is to redirect to /welcome/spaces. Storing them as
// `next` produces meaningless round-trips (or loops).
const SELF_REDIRECTING_PATHS = new Set(['/', '/welcome', '/welcome/spaces'])

/**
 * Sanitise a `next` redirect URL coming from a query param.
 *
 * Returns the URL only if it is a same-origin path (starts with `/` but not
 * `//`), which prevents open-redirect attacks via protocol-relative or
 * absolute URLs.
 *
 * Also rejects paths that themselves redirect to /welcome/spaces (`/`,
 * `/welcome`, `/welcome/spaces`) — round-tripping through them would either
 * loop or land the user on the page they just signed in from.
 */
// Normalise a path for the self-redirect check: strip query/hash and a trailing
// slash so `/welcome/spaces/` is treated the same as `/welcome/spaces`. Next.js
// collapses trailing slashes on `router.push`, so without this a `next` value
// of `/welcome/spaces/` would slip past the blocklist and then loop straight
// back here.
const normalisePathForSelfRedirectCheck = (path: string): string => {
  const pathOnly = path.split('?')[0].split('#')[0]
  if (pathOnly.length > 1 && pathOnly.endsWith('/')) return pathOnly.slice(0, -1)
  return pathOnly
}

export const sanitizeNextUrl = (next: unknown): string | null => {
  if (typeof next !== 'string' || next.length === 0) return null
  if (!next.startsWith('/')) return null
  if (next.startsWith('//') || next.startsWith('/\\')) return null
  if (SELF_REDIRECTING_PATHS.has(normalisePathForSelfRedirectCheck(next))) return null
  return next
}

type ParsedNextUrl = {
  pathname: string
  query: Record<string, string | string[]>
  hash?: string
}

/**
 * Parse a `next` redirect URL into a structured Next.js router URL object.
 *
 * Returns `null` if the URL fails the same-origin/self-redirect checks in
 * `sanitizeNextUrl`. Otherwise returns `{ pathname, query, hash? }` suitable
 * for passing to `router.push()` / `router.replace()`.
 *
 * Reconstructing the URL from parsed components (rather than passing the raw
 * string) makes the sanitisation chain explicit to static analysers like
 * CodeQL, which otherwise flag `router.push(userInput)` as an
 * open-redirect risk even after the value has been validated.
 */
export const parseNextUrlForRouter = (next: unknown): ParsedNextUrl | null => {
  const sanitized = sanitizeNextUrl(next)
  if (!sanitized) return null

  const url = new URL(sanitized, 'http://localhost')
  // Re-check the resolved pathname against the self-redirect blocklist: path
  // traversal (e.g. `/foo/..`) collapses to `/` after URL normalisation, which
  // sanitizeNextUrl can't see by inspecting the raw string.
  if (SELF_REDIRECTING_PATHS.has(normalisePathForSelfRedirectCheck(url.pathname))) return null
  const query: Record<string, string | string[]> = {}
  url.searchParams.forEach((value, key) => {
    const existing = query[key]
    if (existing === undefined) {
      query[key] = value
    } else if (Array.isArray(existing)) {
      existing.push(value)
    } else {
      query[key] = [existing, value]
    }
  })

  const hash = url.hash ? url.hash : undefined
  return hash ? { pathname: url.pathname, query, hash } : { pathname: url.pathname, query }
}

/**
 * Build the current relative URL from a router `pathname` + `query`, suitable
 * for round-tripping through a `next` query param.
 */
export const buildCurrentNextUrl = (pathname: string, query: Record<string, string | string[] | undefined>): string => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (key === 'next') continue
    if (typeof value === 'string') {
      params.set(key, value)
    } else if (Array.isArray(value)) {
      for (const v of value) params.append(key, v)
    }
  }
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}
