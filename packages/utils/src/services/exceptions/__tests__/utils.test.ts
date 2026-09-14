import { asError, getHttpStatusFromError } from '../utils'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

describe('utils', () => {
  describe('asError', () => {
    it('should return the same error if thrown is an instance of Error', () => {
      const thrown = new Error('test error')

      expect(asError(thrown)).toEqual(new Error('test error'))
    })

    it('should return a new Error instance with the thrown value if thrown is a string', () => {
      const thrown = 'test error'

      const result = asError(thrown)
      expect(result).toEqual(new Error('test error'))

      // If stringified:
      expect(result).not.toEqual(new Error('"test error'))
    })

    it('should return a new Error instance with number or boolean primitives', () => {
      expect(asError(42)).toEqual(new Error('42'))
      expect(asError(true)).toEqual(new Error('true'))
      expect(asError(false)).toEqual(new Error('false'))
    })

    it('should return a safe type description for objects to prevent sensitive data exposure', () => {
      const thrown = { message: 'test error', privateKey: 'secret123' }

      const result = asError(thrown)
      expect(result.message).toBe('Non-Error object of type: object')

      // Verify it does NOT expose the object contents
      expect(result.message).not.toContain('privateKey')
      expect(result.message).not.toContain('secret123')
      expect(result.message).not.toContain('test error')
    })

    it('should return a safe type description for arrays to prevent sensitive data exposure', () => {
      const thrown = ['privateKey', 'secret123']

      const result = asError(thrown)
      expect(result.message).toBe('Non-Error object of type: object (array)')

      // Verify it does NOT expose the array contents
      expect(result.message).not.toContain('privateKey')
      expect(result.message).not.toContain('secret123')
    })

    it('should handle circular references safely', () => {
      // Circular dependency
      const thrown: Record<string, unknown> = {}
      thrown.a = { b: thrown }

      const result = asError(thrown)
      expect(result.message).toBe('Non-Error object of type: object')

      // Verify it does NOT try to stringify circular objects
      expect(result.message).not.toContain('[object Object]')
    })

    it('should preserve status code for FetchBaseQueryError', () => {
      const thrown: FetchBaseQueryError = {
        status: 401,
        data: { message: 'Unauthorized' },
      }

      const result = asError(thrown)
      expect(result.message).toBe('Unauthorized')
      expect(result.status).toBe(401)
    })

    it('should handle FetchBaseQueryError with string status code', () => {
      const thrown: FetchBaseQueryError = {
        status: 'FETCH_ERROR',
        error: 'Network error',
      }

      const result = asError(thrown)
      expect(result.message).toBe('FETCH_ERROR: Network error')
      expect(result.status).toBe('FETCH_ERROR')
    })

    it('never surfaces an unparsable response body as the message (WA-3252)', () => {
      // RTK Query cannot JSON-parse a gateway's HTML 502 page: it reports
      // PARSING_ERROR and parks the real status in `originalStatus`.
      const thrown = {
        status: 'PARSING_ERROR',
        originalStatus: 502,
        data: '<html><head><title>502 Bad Gateway</title></head><body><center><h1>502 Bad Gateway</h1></center><hr><center>nginx</center></body></html>',
        error: "SyntaxError: Unexpected token '<'",
      } as FetchBaseQueryError

      const result = asError(thrown)

      expect(result.message).not.toContain('<')
      expect(result.message).not.toContain('nginx')
      expect(result.message).not.toContain('Bad Gateway')
      expect(result.status).toBe(502)
      expect(getHttpStatusFromError(result)).toBe(502)
    })

    it('never surfaces a markup body as the message for a plain HTTP error', () => {
      const thrown: FetchBaseQueryError = { status: 502, data: '<html><body>502 Bad Gateway</body></html>' }

      const result = asError(thrown)

      expect(result.message).not.toContain('<')
      expect(result.status).toBe(502)
    })

    it('still surfaces a plain-text body that is not markup', () => {
      const thrown: FetchBaseQueryError = { status: 429, data: 'Rate limit reached' }

      expect(asError(thrown).message).toBe('Rate limit reached')
    })

    it('keeps the string status when a parsing error carries no original status', () => {
      const thrown: FetchBaseQueryError = {
        status: 'PARSING_ERROR',
        originalStatus: 0,
        data: 'plain body',
        error: 'oops',
      }

      const result = asError(thrown)
      expect(result.status).toBe('PARSING_ERROR')
      expect(result.message).toBe('plain body')
    })

    it('should handle FetchBaseQueryError with missing data.message', () => {
      const thrown: FetchBaseQueryError = {
        status: 500,
        data: undefined,
      }

      const result = asError(thrown)
      expect(result.message).toBe('HTTP Error 500')
      expect(result.status).toBe(500)
    })
  })

  describe('getHttpStatusFromError', () => {
    it('reads a numeric status property (RTK Query / asError)', () => {
      expect(getHttpStatusFromError({ status: 422 })).toBe(422)
      expect(getHttpStatusFromError(Object.assign(new Error('x'), { status: 404 }))).toBe(404)
    })

    it('reads a numeric statusCode property', () => {
      expect(getHttpStatusFromError({ statusCode: 429 })).toBe(429)
    })

    it('parses the status from a CGW SDK error message', () => {
      expect(getHttpStatusFromError(new Error('CGW error - 422: Invalid transaction'))).toBe(422)
    })

    it('parses a wrapped CGW SDK error message', () => {
      expect(getHttpStatusFromError(new Error('Code 805: Error proposing (CGW error - 400: Bad request)'))).toBe(400)
    })

    it('ignores non-HTTP numbers (CGW internal codes, string statuses)', () => {
      expect(getHttpStatusFromError(new Error('CGW error - 1337: Some internal code'))).toBeUndefined()
      expect(getHttpStatusFromError({ status: 'FETCH_ERROR' })).toBeUndefined()
      expect(getHttpStatusFromError({ status: 'PARSING_ERROR', originalStatus: 502 })).toBe(502)
      expect(getHttpStatusFromError({ status: 42 })).toBeUndefined()
    })

    it('returns undefined when no status is present', () => {
      expect(getHttpStatusFromError(new Error('something broke'))).toBeUndefined()
      expect(getHttpStatusFromError(undefined)).toBeUndefined()
      expect(getHttpStatusFromError('string error')).toBeUndefined()
    })
  })
})
