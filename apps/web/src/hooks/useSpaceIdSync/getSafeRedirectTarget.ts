/**
 * Validates a redirect target from a query string. Allows only same-origin
 * absolute paths (e.g. "/home?x=1"). Rejects protocol-relative ("//evil.com"),
 * fully-qualified external URLs, javascript: URLs, and anything that isn't a
 * non-empty string starting with a single "/".
 */
export const getSafeRedirectTarget = (raw: unknown): string | null => {
  if (typeof raw !== 'string' || raw.length === 0) return null
  if (!raw.startsWith('/')) return null
  if (raw.startsWith('//')) return null
  return raw
}
