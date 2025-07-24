import { getNextPageParam } from '../infiniteQuery'

describe('getNextPageParam', () => {
  // Mock console.error to test error handling without cluttering test output
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

  afterEach(() => {
    consoleErrorSpy.mockClear()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('Happy path scenarios', () => {
    it('should extract cursor from a relative URL with single parameter', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/history?cursor=abc123',
      }

      const result = getNextPageParam(lastPage)

      expect(result).toBe('abc123')
    })

    it('should extract cursor from a relative URL with multiple parameters', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/history?trusted=false&cursor=xyz789&limit=20',
      }

      const result = getNextPageParam(lastPage)

      expect(result).toBe('xyz789')
    })

    it('should extract cursor from an absolute URL', () => {
      const lastPage = {
        next: 'https://safe-client.safe.global/v1/chains/1/safes/0x123/transactions/history?cursor=def456',
      }

      const result = getNextPageParam(lastPage)

      expect(result).toBe('def456')
    })

    it('should extract cursor from URL with encoded characters', () => {
      const lastPage = {
        next: '/v2/chains/1/safes/0x123/collectibles?cursor=abc%2B123%3D%3D&trusted=true',
      }

      const result = getNextPageParam(lastPage)

      expect(result).toBe('abc+123==') // URLSearchParams automatically decodes
    })

    it('should handle cursor as first parameter', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/queued?cursor=first123&trusted=false',
      }

      const result = getNextPageParam(lastPage)

      expect(result).toBe('first123')
    })

    it('should handle cursor as last parameter', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/queued?trusted=false&limit=50&cursor=last456',
      }

      const result = getNextPageParam(lastPage)

      expect(result).toBe('last456')
    })
  })

  describe('Edge cases returning undefined', () => {
    it('should return undefined when lastPage is null', () => {
      const result = getNextPageParam(null as any)

      expect(result).toBeUndefined()
    })

    it('should return undefined when lastPage is undefined', () => {
      const result = getNextPageParam(undefined as any)

      expect(result).toBeUndefined()
    })

    it('should return undefined when next is null', () => {
      const lastPage = { next: null }

      const result = getNextPageParam(lastPage)

      expect(result).toBeUndefined()
    })

    it('should return undefined when next is undefined', () => {
      const lastPage = { next: undefined }

      const result = getNextPageParam(lastPage)

      expect(result).toBeUndefined()
    })

    it('should return undefined when next is empty string', () => {
      const lastPage = { next: '' }

      const result = getNextPageParam(lastPage)

      expect(result).toBeUndefined()
    })

    it('should return undefined when URL has no query string', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/history',
      }

      const result = getNextPageParam(lastPage)

      expect(result).toBeUndefined()
    })

    it('should return undefined when URL has empty query string', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/history?',
      }

      const result = getNextPageParam(lastPage)

      expect(result).toBeUndefined()
    })

    it('should return undefined when URL has query parameters but no cursor', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/history?trusted=false&limit=20',
      }

      const result = getNextPageParam(lastPage)

      expect(result).toBeUndefined()
    })

    it('should return undefined when cursor parameter is empty', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/history?cursor=&trusted=false',
      }

      const result = getNextPageParam(lastPage)

      expect(result).toBeUndefined()
    })

    it('should return undefined when cursor parameter has only whitespace', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/history?cursor=%20&trusted=false',
      }

      const result = getNextPageParam(lastPage)

      expect(result).toBeUndefined()
    })
  })

  describe('Error handling', () => {
    it('should handle malformed URLs gracefully and log error', () => {
      // Create a URL that will cause URLSearchParams to throw
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/history?cursor=abc123',
      }

      // Mock URLSearchParams to throw an error
      const originalURLSearchParams = global.URLSearchParams
      global.URLSearchParams = jest.fn(() => {
        throw new Error('Malformed URL')
      })

      const result = getNextPageParam(lastPage)

      expect(result).toBeUndefined()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error extracting cursor from next URL:', expect.any(Error))

      // Restore original URLSearchParams
      global.URLSearchParams = originalURLSearchParams
    })

    it('should handle URLs with special characters', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions?cursor=abc123&param=special%26chars',
      }

      const result = getNextPageParam(lastPage)

      expect(result).toBe('abc123')
    })

    it('should handle very long cursor values', () => {
      const longCursor = 'a'.repeat(1000)
      const lastPage = {
        next: `/v1/chains/1/safes/0x123/transactions?cursor=${longCursor}`,
      }

      const result = getNextPageParam(lastPage)

      expect(result).toBe(longCursor)
    })
  })

  describe('Type safety', () => {
    it('should work with objects that have additional properties', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions?cursor=type_safe_123',
        someOtherProperty: 'value',
        count: 100,
        results: [],
      }

      const result = getNextPageParam(lastPage)

      expect(result).toBe('type_safe_123')
    })

    it('should handle object with minimal structure', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions?cursor=minimal_123',
      }

      const result = getNextPageParam(lastPage)

      expect(result).toBe('minimal_123')
    })
  })
})
