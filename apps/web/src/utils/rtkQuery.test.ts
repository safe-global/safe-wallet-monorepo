import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { getRtkQueryErrorMessage } from './rtkQuery'

const NETWORK_MESSAGE = "Couldn't connect to the server. Please check your connection and try again."
const TIMEOUT_MESSAGE = 'The request timed out. Please try again.'
const RATE_LIMIT_MESSAGE = 'Too many requests. Please wait a moment and try again.'
const GENERIC_MESSAGE = 'Something went wrong. Please try again.'

describe('getRtkQueryErrorMessage', () => {
  it('returns a friendly message for a network failure instead of the raw JS error', () => {
    const error: FetchBaseQueryError = { status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }
    expect(getRtkQueryErrorMessage(error)).toBe(NETWORK_MESSAGE)
  })

  it('returns a friendly message for a timeout', () => {
    const error: FetchBaseQueryError = { status: 'TIMEOUT_ERROR', error: 'AbortError: timeout' }
    expect(getRtkQueryErrorMessage(error)).toBe(TIMEOUT_MESSAGE)
  })

  it('maps a non-JSON 429 body to a rate-limit message instead of the SyntaxError', () => {
    const error: FetchBaseQueryError = {
      status: 'PARSING_ERROR',
      originalStatus: 429,
      data: 'Rate limit reached',
      error: 'SyntaxError: Unexpected token \'R\', "Rate limit reached" is not valid JSON',
    }
    expect(getRtkQueryErrorMessage(error)).toBe(RATE_LIMIT_MESSAGE)
  })

  it('returns a generic message for a non-429 parsing error', () => {
    const error: FetchBaseQueryError = {
      status: 'PARSING_ERROR',
      originalStatus: 500,
      data: 'Internal Server Error',
      error: 'SyntaxError: Unexpected token I',
    }
    expect(getRtkQueryErrorMessage(error)).toBe(GENERIC_MESSAGE)
  })

  it('maps a numeric 429 status to a rate-limit message', () => {
    const error: FetchBaseQueryError = { status: 429, data: {} }
    expect(getRtkQueryErrorMessage(error)).toBe(RATE_LIMIT_MESSAGE)
  })

  it('surfaces the backend message for an HTTP error response', () => {
    const error: FetchBaseQueryError = { status: 400, data: { message: 'Names must be at least 3 characters long' } }
    expect(getRtkQueryErrorMessage(error)).toBe('Names must be at least 3 characters long')
  })

  it('falls back to the status code for an HTTP error with no message', () => {
    const error: FetchBaseQueryError = { status: 400, data: {} }
    expect(getRtkQueryErrorMessage(error)).toBe('Error: 400')
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
    expect(getRtkQueryErrorMessage(error)).toBe('Unknown error')
  })
})
