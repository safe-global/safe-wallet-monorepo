// Arbitrary same-origin base used to normalize the raw input via the URL parser.
// Anything that resolves to a different origin (protocol-relative, absolute external,
// javascript:, etc.) parses with a different `origin` and is rejected.
const SAME_ORIGIN_BASE = 'https://placeholder.invalid'

/**
 * Validates a redirect target from a query string. Allows only same-origin
 * absolute paths (e.g. "/home?x=1"). Rejects protocol-relative ("//evil.com"),
 * fully-qualified external URLs, javascript: URLs, and anything that isn't a
 * non-empty string starting with a single "/".
 *
 * The implementation runs the raw value through `new URL(raw, base)` and verifies
 * `parsed.origin === base`. This is the pattern recognized by CodeQL's
 * `js/client-side-unvalidated-url-redirection` rule as a valid sanitizer, and it
 * also catches obfuscation vectors (backslashes, URL-encoded slashes) that a
 * plain string-prefix check would miss.
 */
export const getSafeRedirectTarget = (raw: unknown): string | null => {
  if (typeof raw !== 'string' || raw.length === 0) return null
  if (!raw.startsWith('/')) return null
  if (raw.startsWith('//')) return null

  try {
    const parsed = new URL(raw, SAME_ORIGIN_BASE)
    if (parsed.origin !== SAME_ORIGIN_BASE) return null
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}
