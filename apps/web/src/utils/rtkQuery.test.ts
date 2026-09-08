import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import {
  getRtkQueryErrorMessage,
  RTK_QUERY_ERROR_MESSAGES,
  getGenericErrorWithStatus,
  getLegalUnavailabilityMessage,
  LEGAL_UNAVAILABILITY_FALLBACK,
} from './rtkQuery'
import { ELEVATION_REQUIRED_ERROR, ELEVATION_REQUIRED_MESSAGE } from '@/features/oidc-auth/utils/elevation'

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

  it("replaces CGW's elevation_required marker with copy written for users", () => {
    const error: FetchBaseQueryError = { status: 403, data: { message: ELEVATION_REQUIRED_ERROR } }
    expect(getRtkQueryErrorMessage(error)).toBe(ELEVATION_REQUIRED_MESSAGE)
  })

  it('still surfaces the backend message for an unrelated 403', () => {
    const error: FetchBaseQueryError = { status: 403, data: { message: 'Signer address not authorized' } }
    expect(getRtkQueryErrorMessage(error)).toBe('Signer address not authorized')
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

describe('getLegalUnavailabilityMessage', () => {
  it('returns the backend reason for a 451 response', () => {
    const error: FetchBaseQueryError = { status: 451, data: { code: 451, message: 'Unavailable for legal reasons' } }
    expect(getLegalUnavailabilityMessage(error)).toBe('Unavailable for legal reasons')
  })

  it('falls back to default copy for a 451 response without a message', () => {
    const error: FetchBaseQueryError = { status: 451, data: {} }
    expect(getLegalUnavailabilityMessage(error)).toBe(LEGAL_UNAVAILABILITY_FALLBACK)
  })

  it('returns undefined for other HTTP errors', () => {
    expect(getLegalUnavailabilityMessage({ status: 404, data: { message: 'Safe not found' } })).toBeUndefined()
    expect(getLegalUnavailabilityMessage({ status: 500, data: {} })).toBeUndefined()
  })

  it('returns undefined for transport-level and serialized errors', () => {
    expect(getLegalUnavailabilityMessage({ status: 'FETCH_ERROR', error: 'Failed to fetch' })).toBeUndefined()
    expect(getLegalUnavailabilityMessage({ name: 'Error', message: 'Something serialized' })).toBeUndefined()
  })

  it('returns undefined when there is no error', () => {
    expect(getLegalUnavailabilityMessage(undefined)).toBeUndefined()
  })
})
