import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'

const HTTP_TOO_MANY_REQUESTS = 429

// User-facing copy for transport-level failures, so raw JS error strings (e.g.
// "TypeError: Failed to fetch", "SyntaxError: ... is not valid JSON" from a plain-text
// "Rate limit reached" body) never reach users.
export const RTK_QUERY_ERROR_MESSAGES = {
  network: "Couldn't connect to the server. Please check your connection and try again.",
  timeout: 'The request timed out. Please try again.',
  rateLimit: 'Too many requests. Please wait a moment and try again.',
  generic: 'Something went wrong. Please try again.',
} as const

/**
 * Extract a user-friendly error message from RTK Query errors.
 *
 * Backend error payloads with a `message` are surfaced as-is (they're written for users,
 * e.g. validation messages). Transport-level failures (network drop, timeout, a non-JSON
 * body such as a plain-text "Rate limit reached") are translated to friendly copy instead
 * of leaking the raw JS error string.
 */
export const getRtkQueryErrorMessage = (error: FetchBaseQueryError | SerializedError): string => {
  if ('status' in error) {
    // FetchBaseQueryError
    const { status } = error

    if (status === 'FETCH_ERROR') return RTK_QUERY_ERROR_MESSAGES.network
    if (status === 'TIMEOUT_ERROR') return RTK_QUERY_ERROR_MESSAGES.timeout
    if (status === 'PARSING_ERROR') {
      return error.originalStatus === HTTP_TOO_MANY_REQUESTS
        ? RTK_QUERY_ERROR_MESSAGES.rateLimit
        : RTK_QUERY_ERROR_MESSAGES.generic
    }

    // HTTP error response: prefer the backend's own message when present.
    if ('data' in error && typeof error.data === 'object' && error.data) {
      const data = error.data as Record<string, unknown>
      if ('message' in data && typeof data.message === 'string') {
        return data.message
      }
    }

    if (status === HTTP_TOO_MANY_REQUESTS) return RTK_QUERY_ERROR_MESSAGES.rateLimit

    // CUSTOM_ERROR carries a developer-provided message string.
    if ('error' in error) return error.error

    return `Error: ${status}`
  }
  // SerializedError
  return error.message || 'Unknown error'
}
