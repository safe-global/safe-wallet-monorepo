import { AppRoutes } from '@/config/routes'

/**
 * Validates that a redirect URL is safe and belongs to the application
 * Prevents open redirect vulnerabilities and XSS attacks
 *
 * @param {string | undefined} url - The URL to validate
 *
 * @returns {boolean} True if the URL is safe, false otherwise
 */
export const isSafeRedirectUrl = (url: string | undefined): boolean => {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    const decodedUrl = decodeURIComponent(url)

    if (decodedUrl.startsWith('/')) {
      if (decodedUrl.match(/^\/\//)) {
        return false
      }

      if (decodedUrl.toLowerCase().match(/^\/?(javascript|data|vbscript):/)) {
        return false
      }

      return true
    }

    return false
  } catch {
    return false
  }
}

/**
 * Parses a query string and returns a record of safe parameter values
 *
 * @param {string} queryString - The query string to parse
 *
 * @returns {Record<string, string>} A record of safe parameter values
 */
const parseQueryString = (queryString: string): Record<string, string> => {
  const query: Record<string, string> = {}
  if (queryString) {
    const params = new URLSearchParams(queryString)
    params.forEach((value, key) => {
      // Only include safe parameter values (no scripts, no data URIs)
      if (!value.toLowerCase().match(/(javascript|data|vbscript):/)) {
        query[key] = value
      }
    })
  }

  return query
}

/**
 * Parses a redirect URL and separates pathname from query parameters
 *
 * @param {string | undefined} url - The URL to parse
 *
 * @returns {Object | null} A safe object with pathname and query, or null if URL is unsafe
 */
export const parseRedirectUrl = (
  url: string | undefined,
): { pathname: string; query: Record<string, string> } | null => {
  if (!isSafeRedirectUrl(url)) {
    return null
  }

  try {
    const urlString = url!
    const [pathname, queryString] = urlString.split('?')

    if (!pathname.startsWith('/')) {
      return null
    }

    const query = parseQueryString(queryString)

    return { pathname, query }
  } catch {
    return null
  }
}

/**
 * Sanitizes and validates the redirect URL
 *
 * @param {string | undefined} url - The URL to sanitize and validate
 *
 * @returns {Object | null} A safe object with pathname and query, or null if URL is unsafe
 */
export const getSafeRedirectUrl = (url: string | undefined): { pathname: string; query: Record<string, string> } => {
  const parsed = parseRedirectUrl(url)

  if (parsed) {
    return parsed
  }

  return { pathname: AppRoutes.welcome.accounts, query: {} }
}

/**
 * Validates that autoConnect parameter is a boolean string
 *
 * @param {unknown} value - The value to validate
 *
 * @returns {boolean} True if the value is a boolean string, false otherwise
 */
export const isValidAutoConnectParam = (value: unknown): boolean => {
  return value === 'true' || value === 'false'
}
