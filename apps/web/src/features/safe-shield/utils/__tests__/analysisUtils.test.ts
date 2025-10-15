import { sortBySeverity, getPrimaryResult } from '../analysisUtils'
import { Severity, ContractStatus } from '@safe-global/utils/features/safe-shield/types'
import type { AnalysisResult } from '@safe-global/utils/features/safe-shield/types'

describe('analysisUtils', () => {
  describe('sortBySeverity', () => {
    it('should sort analysis results by severity priority (CRITICAL > WARN > INFO > OK)', () => {
      const results: AnalysisResult<any>[] = [
        {
          severity: Severity.OK,
          type: ContractStatus.VERIFIED,
          title: 'Verified contract',
          description: 'Contract is verified',
        },
        {
          severity: Severity.CRITICAL,
          type: ContractStatus.NOT_VERIFIED,
          title: 'Critical issue',
          description: 'Critical security issue',
        },
        {
          severity: Severity.INFO,
          type: ContractStatus.VERIFIED,
          title: 'Info message',
          description: 'Informational message',
        },
        {
          severity: Severity.WARN,
          type: ContractStatus.NEW_CONTRACT,
          title: 'Warning',
          description: 'Warning message',
        },
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
      const original: AnalysisResult<any>[] = [
        {
          severity: Severity.OK,
          type: ContractStatus.VERIFIED,
          title: 'OK result',
          description: 'OK description',
        },
        {
          severity: Severity.CRITICAL,
          type: ContractStatus.NOT_VERIFIED,
          title: 'Critical result',
          description: 'Critical description',
        },
      ]

      const originalCopy = [...original]
      sortBySeverity(original)

      expect(original).toEqual(originalCopy)
    })

    it('should handle results with same severity', () => {
      const results: AnalysisResult<any>[] = [
        {
          severity: Severity.WARN,
          type: ContractStatus.NEW_CONTRACT,
          title: 'Warning 1',
          description: 'First warning',
        },
        {
          severity: Severity.WARN,
          type: ContractStatus.NOT_VERIFIED,
          title: 'Warning 2',
          description: 'Second warning',
        },
      ]

      const sorted = sortBySeverity(results)

      expect(sorted).toHaveLength(2)
      expect(sorted[0].severity).toBe(Severity.WARN)
      expect(sorted[1].severity).toBe(Severity.WARN)
    })
  })

  describe('getPrimaryResult', () => {
    it('should return the result with highest severity', () => {
      const results: AnalysisResult<any>[] = [
        {
          severity: Severity.OK,
          type: ContractStatus.VERIFIED,
          title: 'OK result',
          description: 'OK description',
        },
        {
          severity: Severity.CRITICAL,
          type: ContractStatus.NOT_VERIFIED,
          title: 'Critical result',
          description: 'Critical description',
        },
        {
          severity: Severity.WARN,
          type: ContractStatus.NEW_CONTRACT,
          title: 'Warning result',
          description: 'Warning description',
        },
      ]

      const primary = getPrimaryResult(results)

      expect(primary).toBeDefined()
      expect(primary!.severity).toBe(Severity.CRITICAL)
      expect(primary!.title).toBe('Critical result')
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
      const results: AnalysisResult<any>[] = [
        {
          severity: Severity.INFO,
          type: ContractStatus.VERIFIED,
          title: 'Info result',
          description: 'Info description',
        },
      ]

      const primary = getPrimaryResult(results)

      expect(primary).toBeDefined()
      expect(primary!.severity).toBe(Severity.INFO)
      expect(primary!.title).toBe('Info result')
    })

    it('should return first result when all have same severity', () => {
      const results: AnalysisResult<any>[] = [
        {
          severity: Severity.WARN,
          type: ContractStatus.NEW_CONTRACT,
          title: 'First warning',
          description: 'First warning description',
        },
        {
          severity: Severity.WARN,
          type: ContractStatus.NOT_VERIFIED,
          title: 'Second warning',
          description: 'Second warning description',
        },
      ]

      const primary = getPrimaryResult(results)

      expect(primary).toBeDefined()
      expect(primary!.severity).toBe(Severity.WARN)
      expect(primary!.title).toBe('First warning')
    })

    it('should prioritize CRITICAL over all other severities', () => {
      const results: AnalysisResult<any>[] = [
        {
          severity: Severity.WARN,
          type: ContractStatus.NEW_CONTRACT,
          title: 'Warning',
          description: 'Warning description',
        },
        {
          severity: Severity.INFO,
          type: ContractStatus.VERIFIED,
          title: 'Info',
          description: 'Info description',
        },
        {
          severity: Severity.CRITICAL,
          type: ContractStatus.NOT_VERIFIED,
          title: 'Critical',
          description: 'Critical description',
        },
        {
          severity: Severity.OK,
          type: ContractStatus.VERIFIED,
          title: 'OK',
          description: 'OK description',
        },
      ]

      const primary = getPrimaryResult(results)

      expect(primary).toBeDefined()
      expect(primary!.severity).toBe(Severity.CRITICAL)
      expect(primary!.title).toBe('Critical')
    })

    it('should prioritize WARN over INFO and OK', () => {
      const results: AnalysisResult<any>[] = [
        {
          severity: Severity.OK,
          type: ContractStatus.VERIFIED,
          title: 'OK',
          description: 'OK description',
        },
        {
          severity: Severity.INFO,
          type: ContractStatus.VERIFIED,
          title: 'Info',
          description: 'Info description',
        },
        {
          severity: Severity.WARN,
          type: ContractStatus.NEW_CONTRACT,
          title: 'Warning',
          description: 'Warning description',
        },
      ]

      const primary = getPrimaryResult(results)

      expect(primary).toBeDefined()
      expect(primary!.severity).toBe(Severity.WARN)
      expect(primary!.title).toBe('Warning')
    })

    it('should prioritize INFO over OK', () => {
      const results: AnalysisResult<any>[] = [
        {
          severity: Severity.OK,
          type: ContractStatus.VERIFIED,
          title: 'OK',
          description: 'OK description',
        },
        {
          severity: Severity.INFO,
          type: ContractStatus.VERIFIED,
          title: 'Info',
          description: 'Info description',
        },
      ]

      const primary = getPrimaryResult(results)

      expect(primary).toBeDefined()
      expect(primary!.severity).toBe(Severity.INFO)
      expect(primary!.title).toBe('Info')
    })
  })
})
