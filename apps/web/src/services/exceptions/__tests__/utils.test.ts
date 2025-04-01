import { asError } from '@safe-global/utils/services/exceptions/utils'

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
    it('should return a new Error instance with the stringified thrown value if thrown is not an instance of Error', () => {
      const thrown = { message: 'test error' }

      expect(asError(thrown)).toEqual(new Error('{"message":"test error"}'))
    })

    it('should return a new Error instance with the string representation of thrown if JSON.stringify throws an error', () => {
      // Circular dependency
      const thrown: Record<string, unknown> = {}
      thrown.a = { b: thrown }

      expect(asError(thrown)).toEqual(new Error('[object Object]'))
    })
  })
})
