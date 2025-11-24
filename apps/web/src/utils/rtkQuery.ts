import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'

/**
 * Extract a user-friendly error message from RTK Query errors
 */
export const getRtkQueryErrorMessage = (error: FetchBaseQueryError | SerializedError): string => {
  if ('status' in error) {
    // FetchBaseQueryError
    if ('error' in error) {
      return error.error
    }
    if ('data' in error && typeof error.data === 'object' && error.data) {
      const data = error.data as Record<string, unknown>
      if ('message' in data && typeof data.message === 'string') {
        return data.message
      }
    }
    return `Error: ${error.status}`
  }
  // SerializedError
  return error.message || 'Unknown error'
}
