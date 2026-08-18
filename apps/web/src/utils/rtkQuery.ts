import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { ELEVATION_REQUIRED_MESSAGE, isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'

const HTTP_TOO_MANY_REQUESTS = 429
export const HTTP_UNAVAILABLE_FOR_LEGAL_REASONS = 451

// User-facing copy for transport-level failures, so raw JS error strings (e.g.
// "TypeError: Failed to fetch", "SyntaxError: ... is not valid JSON" from a plain-text
// "Rate limit reached" body) never reach users.
export const RTK_QUERY_ERROR_MESSAGES = {
  network: "Couldn't connect to the server. Please check your connection and try again.",
  timeout: 'The request timed out. Please try again.',
  rateLimit: 'Too many requests. Please wait a moment and try again.',
  generic: 'Something went wrong. Please try again, or contact support if it persists.',
} as const

// Shown when the backend blocks a resource for legal reasons but sends no message of its own.
export const LEGAL_UNAVAILABILITY_FALLBACK = 'This Safe account is unavailable for legal reasons'

// Same general copy as `generic`, but keeps the HTTP status visible so the failure stays debuggable.
export const getGenericErrorWithStatus = (status: number): string =>
  `Something went wrong (${status}). Please try again, or contact support if it persists.`

// Backend error payloads are written for users, so their `message` is surfaced as-is.
const getBackendMessage = (error: FetchBaseQueryError): string | undefined => {
  if (!('data' in error) || typeof error.data !== 'object' || !error.data) return undefined
  const { message } = error.data as Record<string, unknown>
  return typeof message === 'string' ? message : undefined
}

/**
 * The backend's reason for a `451 Unavailable for legal reasons` response, or `undefined` for any
 * other failure. Callers use it to tell a blocked resource apart from a generic loading error.
 */
export const getLegalUnavailabilityMessage = (
  error: FetchBaseQueryError | SerializedError | undefined,
): string | undefined => {
  if (!error || !('status' in error) || error.status !== HTTP_UNAVAILABLE_FOR_LEGAL_REASONS) return undefined
  return getBackendMessage(error) || LEGAL_UNAVAILABILITY_FALLBACK
}

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

    // CGW's step-up challenge is a protocol marker, not copy for users. The
    // recovery flow is owned by ElevationRequiredDialog; this only keeps the raw
    // token out of whichever inline error the calling dialog also renders.
    if (isElevationRequiredError(error)) return ELEVATION_REQUIRED_MESSAGE

    // HTTP error response: prefer the backend's own message when present.
    const backendMessage = getBackendMessage(error)
    if (backendMessage) return backendMessage

    if (status === HTTP_TOO_MANY_REQUESTS) return RTK_QUERY_ERROR_MESSAGES.rateLimit

    // CUSTOM_ERROR carries a developer-provided message string.
    if ('error' in error) return error.error

    return typeof status === 'number' ? getGenericErrorWithStatus(status) : RTK_QUERY_ERROR_MESSAGES.generic
  }
  // SerializedError
  return error.message || RTK_QUERY_ERROR_MESSAGES.generic
}
