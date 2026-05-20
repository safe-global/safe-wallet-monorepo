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
export const sanitizeNextUrl = (next: unknown): string | null => {
  if (typeof next !== 'string' || next.length === 0) return null
  if (!next.startsWith('/')) return null
  if (next.startsWith('//') || next.startsWith('/\\')) return null
  const pathOnly = next.split('?')[0].split('#')[0]
  if (SELF_REDIRECTING_PATHS.has(pathOnly)) return null
  return next
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
