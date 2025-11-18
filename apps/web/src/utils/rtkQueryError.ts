import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'

/**
 * Type guard to check if an error is a FetchBaseQueryError
 */
export function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error
}

/**
 * Type guard to check if an error is a SerializedError
 */
export function isSerializedError(error: unknown): error is SerializedError {
  return typeof error === 'object' && error != null && 'message' in error
}

/**
 * Extracts a user-friendly error message from RTK Query errors
 * @param error - The error from RTK Query (FetchBaseQueryError or SerializedError)
 * @param fallback - Fallback message if error cannot be parsed
 * @returns A string error message
 */
export function getRtkQueryErrorMessage(
  error: FetchBaseQueryError | SerializedError | undefined,
  fallback: string = 'An error occurred',
): string | undefined {
  if (!error) return undefined

  // Handle FetchBaseQueryError
  if (isFetchBaseQueryError(error)) {
    if ('error' in error && typeof error.error === 'string') {
      return error.error
    }
    if ('data' in error && typeof error.data === 'string') {
      return error.data
    }
    if (typeof error.status === 'number') {
      return `Error ${error.status}`
    }
  }

  // Handle SerializedError
  if (isSerializedError(error)) {
    return error.message
  }

  // Check if error has an 'error' property (legacy format)
  if (typeof error === 'object' && 'error' in error && typeof error.error === 'string') {
    return error.error
  }

  return fallback
}
