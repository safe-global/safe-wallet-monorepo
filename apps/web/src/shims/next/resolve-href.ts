/**
 * Shim for `next/dist/client/resolve-href`.
 *
 * In Next.js this resolves a UrlObject against the router to produce
 * a full href string. Our SPA version ignores the router argument and
 * simply serializes the UrlObject.
 */

type UrlObject = {
  pathname?: string
  query?: Record<string, string | string[] | undefined>
  hash?: string
  protocol?: string
  host?: string
}

export function resolveHref(_router: unknown, urlObj: string | UrlObject): string {
  if (typeof urlObj === 'string') return urlObj

  const { protocol, host, pathname = '/', query, hash } = urlObj
  const params = new URLSearchParams()

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue
      if (Array.isArray(value)) {
        for (const v of value) params.append(key, v)
      } else {
        params.set(key, value)
      }
    }
  }

  const search = params.toString()
  const hashStr = hash ? `#${hash}` : ''
  const base = protocol && host ? `${protocol}//${host}` : ''
  return `${base}${pathname}${search ? '?' + search : ''}${hashStr}`
}
