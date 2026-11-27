import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import {
  getRtkQueryErrorMessage,
  RTK_QUERY_ERROR_MESSAGES,
  getGenericErrorWithStatus,
  getSafeUnavailableMessage,
  SAFE_UNAVAILABLE_MESSAGE,
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

  it("replaces CGW's seat quota refusal with copy written for users", () => {
    const error: FetchBaseQueryError = {
      status: 402,
      data: {
        code: 'QUOTA_EXCEEDED',
        feature: 'safe_seats',
        quota: 20,
        used: 20,
        resetsAt: null,
        message: 'Quota exceeded for safe_seats: 20 of 20 used.',
      },
    }
    expect(getRtkQueryErrorMessage(error)).toBe(
      'Your plan covers 20 Safe accounts and this Workspace already holds 20. Remove one to add another, or upgrade your plan.',
    )
  })

  it("replaces CGW's sponsored transaction quota refusal with copy written for users", () => {
    const error: FetchBaseQueryError = {
      status: 402,
      data: {
        code: 'QUOTA_EXCEEDED',
        feature: 'sponsored_transactions',
        quota: 50,
        used: 50,
        resetsAt: '2026-11-01T00:00:00.000Z',
        message: 'Quota exceeded for sponsored_transactions: 50 of 50 used.',
      },
    }
    expect(getRtkQueryErrorMessage(error)).toBe(
      'Your Workspace has used all 50 sponsored transactions of this cycle until Nov 1, 2026. Pay the gas with your connected wallet instead.',
    )
  })

  it('surfaces the backend message for a quota refusal on a feature without copy', () => {
    const error: FetchBaseQueryError = {
      status: 402,
      data: {
        code: 'QUOTA_EXCEEDED',
        feature: 'address_book_entries',
        quota: 100,
        used: 100,
        resetsAt: null,
        message: 'Quota exceeded for address_book_entries: 100 of 100 used.',
      },
    }
    expect(getRtkQueryErrorMessage(error)).toBe('Quota exceeded for address_book_entries: 100 of 100 used.')
  })

  it('surfaces the backend message for a 402 that is not a quota refusal', () => {
    const error: FetchBaseQueryError = {
      status: 402,
      data: {
        code: 'FEATURE_NOT_GRANTED',
        feature: 'policies',
        message: "Feature 'policies' is not available on the current plan.",
      },
    }
    expect(getRtkQueryErrorMessage(error)).toBe("Feature 'policies' is not available on the current plan.")
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

describe('getSafeUnavailableMessage', () => {
  it('hides the backend reason for a blocked Safe', () => {
    const error: FetchBaseQueryError = {
      status: 451,
      data: { code: 451, message: 'Blocked in your region by provider edge-node-7' },
    }
    expect(getSafeUnavailableMessage(error)).toBe(SAFE_UNAVAILABLE_MESSAGE)
  })

  it('returns the same copy for a 451 without a message', () => {
    const error: FetchBaseQueryError = { status: 451, data: {} }
    expect(getSafeUnavailableMessage(error)).toBe(SAFE_UNAVAILABLE_MESSAGE)
  })

  it('returns undefined for other HTTP errors', () => {
    expect(getSafeUnavailableMessage({ status: 404, data: { message: 'Safe not found' } })).toBeUndefined()
    expect(getSafeUnavailableMessage({ status: 500, data: {} })).toBeUndefined()
  })

  it('returns undefined for transport-level and serialized errors', () => {
    expect(getSafeUnavailableMessage({ status: 'FETCH_ERROR', error: 'Failed to fetch' })).toBeUndefined()
    expect(getSafeUnavailableMessage({ name: 'Error', message: 'Something serialized' })).toBeUndefined()
  })

  it('returns undefined when there is no error', () => {
    expect(getSafeUnavailableMessage(undefined)).toBeUndefined()
  })
})
