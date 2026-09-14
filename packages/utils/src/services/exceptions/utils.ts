/**
 * Safely converts unknown thrown values to Error objects without exposing sensitive data.
 * This is critical for wallet applications to prevent private keys or other sensitive
 * data from appearing in error messages or logs.
 */

import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

interface ErrorWithStatus extends Error {
  status?: number | string
}

const isFetchBaseQueryError = (error: unknown): error is FetchBaseQueryError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (typeof (error as Record<string, unknown>).status === 'number' ||
      typeof (error as Record<string, unknown>).status === 'string')
  )
}

/** A response body that is an error page (HTML/XML) rather than a message. */
const isMarkup = (body: string): boolean => /^\s*</.test(body)

export const asError = (thrown: unknown): ErrorWithStatus => {
  if (thrown instanceof Error) {
    return thrown as ErrorWithStatus
  }

  // Handle RTK Query FetchBaseQueryError - preserve status for downstream consumers
  // like isUnauthorized() checks in the spaces feature
  if (isFetchBaseQueryError(thrown)) {
    let errorMessage: string

    // An unparsable body means RTK Query could not read the response as JSON —
    // typically a gateway answering a 5xx with an HTML error page. That body
    // must never become the error message: it is rendered verbatim in error
    // details. Keep the real HTTP status (RTK Query parks it in
    // `originalStatus`) so the UI can map it to agreed copy instead.
    const originalStatus = (thrown as { originalStatus?: unknown }).originalStatus
    if (thrown.status === 'PARSING_ERROR' && isHttpStatus(originalStatus)) {
      const parsingError = new Error(`Request failed with status ${originalStatus}`) as ErrorWithStatus
      parsingError.status = originalStatus
      return parsingError
    }

    // Extract message from the error
    if (typeof thrown.data === 'object' && thrown.data !== null && 'message' in thrown.data) {
      errorMessage = String((thrown.data as Record<string, unknown>).message)
    } else if (typeof thrown.data === 'string' && !isMarkup(thrown.data)) {
      errorMessage = thrown.data
    } else if (typeof thrown.data === 'string') {
      // Markup body (an error page) — same reasoning as above.
      errorMessage = `Request failed with status ${String(thrown.status)}`
    } else if (typeof thrown.status === 'string') {
      // For string error codes like 'FETCH_ERROR', 'PARSING_ERROR', use the status as message
      errorMessage = thrown.status
      if ('error' in thrown) {
        errorMessage = `${thrown.status}: ${String((thrown as Record<string, unknown>).error)}`
      }
    } else {
      errorMessage = `HTTP Error ${thrown.status}`
    }

    const error = new Error(errorMessage) as ErrorWithStatus
    error.status = thrown.status
    return error
  }

  let message: string

  if (typeof thrown === 'string') {
    message = thrown
  } else if (typeof thrown === 'number' || typeof thrown === 'boolean') {
    message = String(thrown)
  } else {
    // For objects, arrays, or other complex types, only log the type
    // Never serialize them as they could contain sensitive data
    message = `Non-Error object of type: ${typeof thrown}${Array.isArray(thrown) ? ' (array)' : ''}`
  }

  return new Error(message) as ErrorWithStatus
}

/** CGW SDK errors flatten the HTTP status into the message: "CGW error - 422: ..." */
const CGW_STATUS_RE = /\bCGW error - ([1-5]\d{2}):/

const isHttpStatus = (value: unknown): value is number => typeof value === 'number' && value >= 100 && value <= 599

/**
 * Extracts the HTTP status of a failed request from an unknown thrown value,
 * checking structural fields first (RTK Query / `asError` set `status`, the
 * CGW SDK's `ErrorResponse` uses `statusCode`, RTK Query parks the real status
 * of an unparsable response in `originalStatus`) and falling back to the CGW
 * SDK message format. Returns `undefined` when no plausible HTTP status is
 * found, so non-HTTP numbers (e.g. CGW internal codes) are never misreported.
 */
export const getHttpStatusFromError = (thrown: unknown): number | undefined => {
  if (typeof thrown === 'object' && thrown !== null) {
    const { status, statusCode, originalStatus } = thrown as {
      status?: unknown
      statusCode?: unknown
      originalStatus?: unknown
    }
    if (isHttpStatus(status)) return status
    if (isHttpStatus(statusCode)) return statusCode
    if (isHttpStatus(originalStatus)) return originalStatus
  }

  if (thrown instanceof Error) {
    const match = thrown.message.match(CGW_STATUS_RE)
    if (match) return Number(match[1])
  }

  return undefined
}
