import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import type { UseFormSetError, FieldValues, FieldPath } from 'react-hook-form'

const HTTP_TOO_MANY_REQUESTS = 429
const HTTP_UNPROCESSABLE_ENTITY = 422

// User-facing copy for transport-level failures, so raw JS error strings (e.g.
// "TypeError: Failed to fetch", "SyntaxError: ... is not valid JSON" from a plain-text
// "Rate limit reached" body) never reach users.
export const RTK_QUERY_ERROR_MESSAGES = {
  network: "Couldn't connect to the server. Please check your connection and try again.",
  timeout: 'The request timed out. Please try again.',
  rateLimit: 'Too many requests. Please wait a moment and try again.',
  generic: 'Something went wrong. Please try again, or contact support if it persists.',
} as const

// Same general copy as `generic`, but keeps the HTTP status visible so the failure stays debuggable.
export const getGenericErrorWithStatus = (status: number): string =>
  `Something went wrong (${status}). Please try again, or contact support if it persists.`

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

    return typeof status === 'number' ? getGenericErrorWithStatus(status) : RTK_QUERY_ERROR_MESSAGES.generic
  }
  // SerializedError
  return error.message || RTK_QUERY_ERROR_MESSAGES.generic
}

const isUnprocessableEntity = (error: unknown): error is FetchBaseQueryError =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  (error as FetchBaseQueryError).status === HTTP_UNPROCESSABLE_ENTITY

/**
 * Maps a backend 422 onto a form field so its message shows inline. Returns true when set
 * (caller falls back to a toast otherwise). The field is caller-supplied because the 422
 * `path` is `[]` for bare-string schemas.
 */
export const applyBackendNameError = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  field: FieldPath<T>,
): boolean => {
  if (!isUnprocessableEntity(error)) return false
  setError(field, { type: 'server', message: getRtkQueryErrorMessage(error) })
  return true
}

// Non-RHF variant: returns the 422 message for local error state, or undefined otherwise.
export const getBackendNameError = (error: unknown): string | undefined =>
  isUnprocessableEntity(error) ? getRtkQueryErrorMessage(error) : undefined
