import { AppRoutes } from '@/config/routes'

/**
 * Fully decodes a URL to prevent multiple encoding bypass attacks
 *
 * @param {string} url - The URL to decode
 * @param {number} maxIterations - Maximum number of decode iterations to prevent infinite loops
 *
 * @returns {string} The fully decoded URL
 */
const fullyDecodeUrl = (url: string, maxIterations = 10): string => {
  let decoded = url
  let previousDecoded = ''
  let iterations = 0

  while (decoded !== previousDecoded && iterations < maxIterations) {
    previousDecoded = decoded
    try {
      decoded = decodeURIComponent(decoded)
    } catch {
      break
    }
    iterations++
  }

  return decoded
}

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
    const trimmedUrl = url.replace(/[\s\r\n\t]/g, '')

    const normalizedUrl = trimmedUrl.normalize('NFKC')

    const decodedUrl = fullyDecodeUrl(normalizedUrl)

    if (decodedUrl.includes('\\')) {
      return false
    }

    if (decodedUrl.includes('\0') || decodedUrl.includes('%00')) {
      return false
    }

    if (!decodedUrl.startsWith('/') || decodedUrl.startsWith('//')) {
      return false
    }

    const dangerousProtocols = /^\/?(javascript|data|vbscript|file|about|blob):/i
    if (dangerousProtocols.test(decodedUrl)) {
      return false
    }

    if (decodedUrl.match(/^\/+\//)) {
      return false
    }

    if (decodedUrl.includes('@')) {
      return false
    }

    return true
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
      try {
        const decodedValue = fullyDecodeUrl(value)
        const normalizedValue = decodedValue.normalize('NFKC')

        const dangerousProtocols = /(javascript|data|vbscript|file|about|blob):/i
        if (dangerousProtocols.test(normalizedValue)) {
          return
        }

        if (normalizedValue.includes('\\') || normalizedValue.includes('\0')) {
          return
        }

        if (normalizedValue.match(/^\/\//)) {
          return
        }

        query[key] = value
      } catch {
        return
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
    let urlString = url!

    const hashIndex = urlString.indexOf('#')
    if (hashIndex !== -1) {
      urlString = urlString.substring(0, hashIndex)
    }

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
