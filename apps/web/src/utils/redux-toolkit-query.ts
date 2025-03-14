import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

/**
 * Extracts and returns an error message from a given `FetchBaseQueryError` or `SerializedError` object.
 *
 * @param error - The error object which can be either `FetchBaseQueryError` or `SerializedError`.
 * @returns A string representing the error message.
 */
const getRTKErrorMessage = (error: FetchBaseQueryError | SerializedError): string => {
  if ('data' in error && error.data != null) {
    if (typeof error.data === 'string') return error.data
    if (typeof error.data === 'object' && 'message' in error.data && typeof error.data.message === 'string')
      return error.data.message
  }

  return 'message' in error && typeof error.message === 'string' ? error.message : 'Unknown error'
}

export { getRTKErrorMessage }
