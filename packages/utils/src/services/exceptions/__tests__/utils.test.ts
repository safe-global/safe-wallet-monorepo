import { asError } from '../utils'
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
})
