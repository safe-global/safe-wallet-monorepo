import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { getRtkQueryErrorMessage, RTK_QUERY_ERROR_MESSAGES, getGenericErrorWithStatus } from './rtkQuery'

describe('getRtkQueryErrorMessage', () => {
  it('returns a friendly message for a network failure instead of the raw JS error', () => {
    const error: FetchBaseQueryError = { status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }
    expect(getRtkQueryErrorMessage(error)).toBe(RTK_QUERY_ERROR_MESSAGES.network)
  })

  it('returns a friendly message for a timeout', () => {
    const error: FetchBaseQueryError = { status: 'TIMEOUT_ERROR', error: 'AbortError: timeout' }
    expect(getRtkQueryErrorMessage(error)).toBe(RTK_QUERY_ERROR_MESSAGES.timeout)
  })

  it('maps a non-JSON 429 body to a rate-limit message instead of the SyntaxError', () => {
    const error: FetchBaseQueryError = {
      status: 'PARSING_ERROR',
      originalStatus: 429,
      data: 'Rate limit reached',
      error: 'SyntaxError: Unexpected token \'R\', "Rate limit reached" is not valid JSON',
    }
    expect(getRtkQueryErrorMessage(error)).toBe(RTK_QUERY_ERROR_MESSAGES.rateLimit)
  })

  it('returns a generic message for a non-429 parsing error', () => {
    const error: FetchBaseQueryError = {
      status: 'PARSING_ERROR',
      originalStatus: 500,
      data: 'Internal Server Error',
      error: 'SyntaxError: Unexpected token I',
    }
    expect(getRtkQueryErrorMessage(error)).toBe(RTK_QUERY_ERROR_MESSAGES.generic)
  })

  it('maps a numeric 429 status to a rate-limit message', () => {
    const error: FetchBaseQueryError = { status: 429, data: {} }
    expect(getRtkQueryErrorMessage(error)).toBe(RTK_QUERY_ERROR_MESSAGES.rateLimit)
  })

  it('surfaces the backend message for an HTTP error response', () => {
    const error: FetchBaseQueryError = { status: 400, data: { message: 'Names must be at least 3 characters long' } }
    expect(getRtkQueryErrorMessage(error)).toBe('Names must be at least 3 characters long')
  })

  it('returns a generic message with the status code for an HTTP error with no message', () => {
    const error: FetchBaseQueryError = { status: 400, data: {} }
    expect(getRtkQueryErrorMessage(error)).toBe(getGenericErrorWithStatus(400))
  })

  it('passes through a CUSTOM_ERROR developer message', () => {
    const error: FetchBaseQueryError = { status: 'CUSTOM_ERROR', error: 'Custom failure' }
    expect(getRtkQueryErrorMessage(error)).toBe('Custom failure')
  })

  it('returns the message of a SerializedError', () => {
    const error: SerializedError = { name: 'Error', message: 'Something serialized' }
    expect(getRtkQueryErrorMessage(error)).toBe('Something serialized')
  })

  it('falls back to a generic message for an empty SerializedError', () => {
    const error: SerializedError = {}
    expect(getRtkQueryErrorMessage(error)).toBe(RTK_QUERY_ERROR_MESSAGES.generic)
  })
})
