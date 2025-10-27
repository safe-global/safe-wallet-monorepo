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

export const asError = (thrown: unknown): ErrorWithStatus => {
  if (thrown instanceof Error) {
    return thrown as ErrorWithStatus
  }

  // Handle RTK Query FetchBaseQueryError - preserve status for downstream consumers
  // like isUnauthorized() checks in the spaces feature
  if (isFetchBaseQueryError(thrown)) {
    let errorMessage: string

    // Extract message from the error
    if (typeof thrown.data === 'object' && thrown.data !== null && 'message' in thrown.data) {
      errorMessage = String((thrown.data as Record<string, unknown>).message)
    } else if (typeof thrown.data === 'string') {
      errorMessage = thrown.data
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
