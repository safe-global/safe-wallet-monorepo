import { sortBySeverity, getPrimaryResult } from '../analysisUtils'
import { Severity } from '../../types'

describe('analysisUtils', () => {
  describe('sortBySeverity', () => {
    it('should sort analysis results by severity priority (CRITICAL > WARN > INFO > OK)', () => {
      const results = [
        { severity: Severity.OK },
        { severity: Severity.CRITICAL },
        { severity: Severity.INFO },
        { severity: Severity.WARN },
      ]

      const sorted = sortBySeverity(results)

      expect(sorted).toHaveLength(4)
      expect(sorted[0].severity).toBe(Severity.CRITICAL)
      expect(sorted[1].severity).toBe(Severity.WARN)
      expect(sorted[2].severity).toBe(Severity.INFO)
      expect(sorted[3].severity).toBe(Severity.OK)
    })

    it('should return empty array for empty input', () => {
      const result = sortBySeverity([])
      expect(result).toEqual([])
    })

    it('should not mutate the original array', () => {
      const original = [{ severity: Severity.OK }, { severity: Severity.CRITICAL }]

      const originalCopy = [...original]
      sortBySeverity(original)

      expect(original).toEqual(originalCopy)
    })

    it('should handle results with same severity', () => {
      const results = [{ severity: Severity.WARN }, { severity: Severity.WARN }]

      const sorted = sortBySeverity(results)

      expect(sorted).toHaveLength(2)
      expect(sorted[0].severity).toBe(Severity.WARN)
      expect(sorted[1].severity).toBe(Severity.WARN)
    })
  })

  describe('getPrimaryResult', () => {
    it('should return the result with highest severity', () => {
      const results = [{ severity: Severity.OK }, { severity: Severity.CRITICAL }, { severity: Severity.WARN }]

      const primary = getPrimaryResult(results)

      expect(primary).toBeDefined()
      expect(primary!.severity).toBe(Severity.CRITICAL)
    })

    it('should return null for empty array', () => {
      const result = getPrimaryResult([])
      expect(result).toBeNull()
    })

    it('should return null for undefined input', () => {
      const result = getPrimaryResult(undefined as any)
      expect(result).toBeNull()
    })

    it('should return null for null input', () => {
      const result = getPrimaryResult(null as any)
      expect(result).toBeNull()
    })

    it('should return the only result when array has one element', () => {
      const results = [{ severity: Severity.INFO }]

      const primary = getPrimaryResult(results)

      expect(primary).toBeDefined()
      expect(primary!.severity).toBe(Severity.INFO)
    })

    it('should return first result when all have same severity', () => {
      const results = [
        { severity: Severity.WARN, title: 'First warning' },
        { severity: Severity.WARN, title: 'Second warning' },
      ]

      const primary = getPrimaryResult(results)

      expect(primary).toBeDefined()
      expect(primary!.severity).toBe(Severity.WARN)
      expect(primary!.title).toBe('First warning')
    })

    it('should prioritize CRITICAL over all other severities', () => {
      const results = [
        { severity: Severity.WARN },
        { severity: Severity.INFO },
        { severity: Severity.CRITICAL },
        { severity: Severity.OK },
      ]

      const primary = getPrimaryResult(results)

      expect(primary).toBeDefined()
      expect(primary!.severity).toBe(Severity.CRITICAL)
    })

    it('should prioritize WARN over INFO and OK', () => {
      const results = [{ severity: Severity.OK }, { severity: Severity.INFO }, { severity: Severity.WARN }]

      const primary = getPrimaryResult(results)

      expect(primary).toBeDefined()
      expect(primary!.severity).toBe(Severity.WARN)
    })

    it('should prioritize INFO over OK', () => {
      const results = [{ severity: Severity.OK }, { severity: Severity.INFO }]

      const primary = getPrimaryResult(results)

      expect(primary).toBeDefined()
      expect(primary!.severity).toBe(Severity.INFO)
    })
  })
})
