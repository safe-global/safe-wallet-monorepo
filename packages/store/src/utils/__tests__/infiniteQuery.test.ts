import { describe, it, expect } from '@jest/globals'
import { getNextPageParam, getPreviousPageParam } from '../infiniteQuery'

describe('getNextPageParam', () => {
  it('should return undefined for null lastPage', () => {
    expect(getNextPageParam(null as any)).toBeUndefined()
  })

  it('should return undefined for lastPage without next', () => {
    expect(getNextPageParam({})).toBeUndefined()
    expect(getNextPageParam({ next: null })).toBeUndefined()
    expect(getNextPageParam({ next: '' })).toBeUndefined()
  })

  describe('Happy path scenarios', () => {
    it('should extract cursor from relative URL', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/history?cursor=abc123&limit=20',
      }
      expect(getNextPageParam(lastPage)).toBe('abc123')
    })

    it('should extract cursor from full URL', () => {
      const lastPage = {
        next: 'https://safe-client.safe.global/v1/chains/1/safes/0x123/transactions/history?cursor=def456&limit=20',
      }
      expect(getNextPageParam(lastPage)).toBe('def456')
    })

    it('should extract cursor with multiple query parameters', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/history?limit=20&cursor=ghi789&timezone=UTC',
      }
      expect(getNextPageParam(lastPage)).toBe('ghi789')
    })

    it('should handle encoded cursor values', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/history?cursor=2023-01-01T00%3A00%3A00Z',
      }
      expect(getNextPageParam(lastPage)).toBe('2023-01-01T00:00:00Z')
    })
  })

  describe('Edge cases', () => {
    it('should return undefined for URL without query string', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/history',
      }
      expect(getNextPageParam(lastPage)).toBeUndefined()
    })

    it('should return undefined for empty cursor', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/history?cursor=&limit=20',
      }
      expect(getNextPageParam(lastPage)).toBeUndefined()
    })

    it('should return undefined for whitespace-only cursor', () => {
      const lastPage = {
        next: '/v1/chains/1/safes/0x123/transactions/history?cursor=   &limit=20',
      }
      expect(getNextPageParam(lastPage)).toBeUndefined()
    })

    it('should handle malformed URLs gracefully', () => {
      const lastPage = {
        next: 'not-a-valid-url',
      }
      expect(getNextPageParam(lastPage)).toBeUndefined()
    })
  })
})

describe('getPreviousPageParam', () => {
  it('should return undefined for null firstPage', () => {
    expect(getPreviousPageParam(null as any)).toBeUndefined()
  })

  it('should return undefined for firstPage without previous', () => {
    expect(getPreviousPageParam({})).toBeUndefined()
    expect(getPreviousPageParam({ previous: null })).toBeUndefined()
    expect(getPreviousPageParam({ previous: '' })).toBeUndefined()
  })

  describe('Happy path scenarios', () => {
    it('should extract cursor from relative URL', () => {
      const firstPage = {
        previous: '/v1/chains/1/safes/0x123/transactions/history?cursor=abc123&limit=20',
      }
      expect(getPreviousPageParam(firstPage)).toBe('abc123')
    })

    it('should extract cursor from full URL', () => {
      const firstPage = {
        previous: 'https://safe-client.safe.global/v1/chains/1/safes/0x123/transactions/history?cursor=def456&limit=20',
      }
      expect(getPreviousPageParam(firstPage)).toBe('def456')
    })

    it('should extract cursor with multiple query parameters', () => {
      const firstPage = {
        previous: '/v1/chains/1/safes/0x123/transactions/history?limit=20&cursor=ghi789&timezone=UTC',
      }
      expect(getPreviousPageParam(firstPage)).toBe('ghi789')
    })

    it('should handle encoded cursor values', () => {
      const firstPage = {
        previous: '/v1/chains/1/safes/0x123/transactions/history?cursor=2023-01-01T00%3A00%3A00Z',
      }
      expect(getPreviousPageParam(firstPage)).toBe('2023-01-01T00:00:00Z')
    })
  })

  describe('Edge cases', () => {
    it('should return undefined for URL without query string', () => {
      const firstPage = {
        previous: '/v1/chains/1/safes/0x123/transactions/history',
      }
      expect(getPreviousPageParam(firstPage)).toBeUndefined()
    })

    it('should return undefined for empty cursor', () => {
      const firstPage = {
        previous: '/v1/chains/1/safes/0x123/transactions/history?cursor=&limit=20',
      }
      expect(getPreviousPageParam(firstPage)).toBeUndefined()
    })

    it('should return undefined for whitespace-only cursor', () => {
      const firstPage = {
        previous: '/v1/chains/1/safes/0x123/transactions/history?cursor=   &limit=20',
      }
      expect(getPreviousPageParam(firstPage)).toBeUndefined()
    })

    it('should handle malformed URLs gracefully', () => {
      const firstPage = {
        previous: 'not-a-valid-url',
      }
      expect(getPreviousPageParam(firstPage)).toBeUndefined()
    })
  })
})
