import { renderHook } from '@testing-library/react'
import { useParsedOrigin } from '../useParsedOrigin'
import { testFixtures } from './useParsedOrigin.test.fixtures'

describe('useParsedOrigin', () => {
  describe('undefined input', () => {
    it('should return undefined when originProp is undefined', () => {
      const { result } = renderHook(() => useParsedOrigin(undefined))

      expect(result.current).toBeUndefined()
    })

    it('should return undefined when originProp is not provided', () => {
      const { result } = renderHook(() => useParsedOrigin())

      expect(result.current).toBeUndefined()
    })
  })

  describe('plain string input', () => {
    it('should return the original string when originProp is a plain string', () => {
      const { result } = renderHook(() => useParsedOrigin(testFixtures.plainStrings.validUrl))

      expect(result.current).toBe(testFixtures.plainStrings.validUrl)
    })

    it('should return the original string when originProp is not valid JSON', () => {
      const { result } = renderHook(() => useParsedOrigin(testFixtures.plainStrings.invalidJson))

      expect(result.current).toBe(testFixtures.plainStrings.invalidJson)
    })
  })

  describe('JSON string input', () => {
    it('should parse JSON and return url when url is a non-empty string', () => {
      const jsonOrigin = testFixtures.jsonStrings.validUrl()
      const expectedUrl = 'https://parsed.example.com'

      const { result } = renderHook(() => useParsedOrigin(jsonOrigin))

      expect(result.current).toBe(expectedUrl)
    })

    it('should return undefined when JSON has empty url string', () => {
      const jsonOrigin = testFixtures.jsonStrings.emptyUrl()

      const { result } = renderHook(() => useParsedOrigin(jsonOrigin))

      expect(result.current).toBeUndefined()
    })

    it('should return undefined when JSON has url as non-string type', () => {
      const jsonOrigin = testFixtures.jsonStrings.nonStringUrl()

      const { result } = renderHook(() => useParsedOrigin(jsonOrigin))

      expect(result.current).toBeUndefined()
    })

    it('should return undefined when JSON has url as null', () => {
      const jsonOrigin = testFixtures.jsonStrings.nullUrl()

      const { result } = renderHook(() => useParsedOrigin(jsonOrigin))

      expect(result.current).toBeUndefined()
    })

    it('should return undefined when JSON does not have url property', () => {
      const jsonOrigin = testFixtures.jsonStrings.noUrlProperty()

      const { result } = renderHook(() => useParsedOrigin(jsonOrigin))

      expect(result.current).toBeUndefined()
    })

    it('should return undefined when JSON is empty object', () => {
      const jsonOrigin = testFixtures.jsonStrings.emptyObject()

      const { result } = renderHook(() => useParsedOrigin(jsonOrigin))

      expect(result.current).toBeUndefined()
    })

    it('should handle JSON with multiple properties including url', () => {
      const jsonOrigin = testFixtures.jsonStrings.multipleProperties()
      const expectedUrl = 'https://complex.example.com'

      const { result } = renderHook(() => useParsedOrigin(jsonOrigin))

      expect(result.current).toBe(expectedUrl)
    })
  })

  describe('memoization', () => {
    it('should update result when originProp changes', () => {
      const { result, rerender } = renderHook(({ origin }) => useParsedOrigin(origin), {
        initialProps: { origin: testFixtures.plainStrings.firstUrl },
      })

      expect(result.current).toBe(testFixtures.plainStrings.firstUrl)

      rerender({ origin: testFixtures.plainStrings.secondUrl })

      expect(result.current).toBe(testFixtures.plainStrings.secondUrl)
    })

    it('should update result when originProp changes from plain string to JSON', () => {
      const { result, rerender } = renderHook(({ origin }) => useParsedOrigin(origin), {
        initialProps: { origin: testFixtures.plainStrings.plainUrl },
      })

      expect(result.current).toBe(testFixtures.plainStrings.plainUrl)

      const jsonOrigin = testFixtures.jsonStrings.validUrl()
      rerender({ origin: jsonOrigin })

      expect(result.current).toBe('https://parsed.example.com')
    })

    it('should update result when originProp changes from JSON to plain string', () => {
      const jsonOrigin = testFixtures.jsonStrings.validUrl()
      const { result, rerender } = renderHook(({ origin }) => useParsedOrigin(origin), {
        initialProps: { origin: jsonOrigin },
      })

      expect(result.current).toBe('https://parsed.example.com')

      rerender({ origin: testFixtures.plainStrings.plainUrl })

      expect(result.current).toBe(testFixtures.plainStrings.plainUrl)
    })

    it('should not update result when originProp reference stays the same', () => {
      const origin = testFixtures.plainStrings.sameUrl
      const { result, rerender } = renderHook(() => useParsedOrigin(origin))

      const firstResult = result.current

      rerender()

      expect(result.current).toBe(firstResult)
      expect(result.current).toBe(origin)
    })
  })

  describe('edge cases', () => {
    it('should return whitespace-only url as it has length > 0', () => {
      const jsonOrigin = testFixtures.jsonStrings.whitespaceUrl()
      const whitespaceUrl = '   '

      const { result } = renderHook(() => useParsedOrigin(jsonOrigin))

      // Whitespace strings have length > 0, so they are returned
      expect(result.current).toBe(whitespaceUrl)
    })

    it('should handle JSON with url as array', () => {
      const jsonOrigin = testFixtures.jsonStrings.arrayUrl()

      const { result } = renderHook(() => useParsedOrigin(jsonOrigin))

      expect(result.current).toBeUndefined()
    })

    it('should handle JSON with url as object', () => {
      const jsonOrigin = testFixtures.jsonStrings.objectUrl()

      const { result } = renderHook(() => useParsedOrigin(jsonOrigin))

      expect(result.current).toBeUndefined()
    })

    it('should handle malformed JSON strings gracefully', () => {
      const { result } = renderHook(() => useParsedOrigin(testFixtures.malformed.incompleteJson))

      expect(result.current).toBe(testFixtures.malformed.incompleteJson)
    })

    it('should handle JSON with escaped characters in url', () => {
      const jsonOrigin = testFixtures.jsonStrings.escapedChars()
      const expectedUrl = testFixtures.plainStrings.complexUrl

      const { result } = renderHook(() => useParsedOrigin(jsonOrigin))

      expect(result.current).toBe(expectedUrl)
    })
  })
})
