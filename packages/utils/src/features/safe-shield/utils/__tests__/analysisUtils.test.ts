import { faker } from '@faker-js/faker'
import { sortBySeverity, getPrimaryResult, dedupeAnalysisResults, pruneOkResults } from '../analysisUtils'
import { Severity, ThreatStatus } from '../../types'
import { ThreatAnalysisResultBuilder } from '../../builders/threat-analysis-result.builder'

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

  describe('dedupeAnalysisResults', () => {
    const addressA = faker.finance.ethereumAddress()
    const addressB = faker.finance.ethereumAddress()

    it('should keep the most severe result when results differ only in severity', () => {
      const warn = ThreatAnalysisResultBuilder.ownershipChange().severity(Severity.WARN).build()
      const critical = ThreatAnalysisResultBuilder.ownershipChange().severity(Severity.CRITICAL).build()

      const deduped = dedupeAnalysisResults([warn, critical])

      expect(deduped).toHaveLength(1)
      expect(deduped[0].severity).toBe(Severity.CRITICAL)
    })

    it('should remove exact duplicates', () => {
      const result = ThreatAnalysisResultBuilder.moduleChange().build()

      const deduped = dedupeAnalysisResults([result, { ...result }, { ...result }])

      expect(deduped).toEqual([result])
    })

    it('should keep results of the same type with different descriptions', () => {
      const first = ThreatAnalysisResultBuilder.customCheckFailed().description('Check A failed.').build()
      const second = ThreatAnalysisResultBuilder.customCheckFailed().description('Check B failed.').build()

      const deduped = dedupeAnalysisResults([first, second])

      expect(deduped).toHaveLength(2)
    })

    it('should keep results of the same type with different titles', () => {
      const first = ThreatAnalysisResultBuilder.customCheckFailed().title('Malicious threat detected').build()
      const second = ThreatAnalysisResultBuilder.customCheckFailed().title('Moderate threat detected').build()

      const deduped = dedupeAnalysisResults([first, second])

      expect(deduped).toHaveLength(2)
    })

    it('should keep results that differ only in addresses', () => {
      const base = ThreatAnalysisResultBuilder.ownershipChange().build()
      const onA = { ...base, addresses: [{ address: addressA }] }
      const onB = { ...base, addresses: [{ address: addressB }] }

      const deduped = dedupeAnalysisResults([onA, onB])

      expect(deduped).toHaveLength(2)
    })

    it('should treat the same addresses in a different order as duplicates', () => {
      const base = ThreatAnalysisResultBuilder.ownershipChange().build()
      const ab = { ...base, addresses: [{ address: addressA }, { address: addressB }] }
      const ba = { ...base, addresses: [{ address: addressB }, { address: addressA }] }

      const deduped = dedupeAnalysisResults([ab, ba])

      expect(deduped).toHaveLength(1)
    })

    it('should ignore address name and logo when comparing', () => {
      const base = ThreatAnalysisResultBuilder.ownershipChange().build()
      const plain = { ...base, addresses: [{ address: addressA }] }
      const decorated = { ...base, addresses: [{ address: addressA, name: 'Alice', logoUrl: 'https://x/y.png' }] }

      const deduped = dedupeAnalysisResults([plain, decorated])

      expect(deduped).toHaveLength(1)
    })

    it('should keep mastercopy changes with different targets', () => {
      const first = ThreatAnalysisResultBuilder.masterCopyChange().changes(addressA, addressB).build()
      const second = ThreatAnalysisResultBuilder.masterCopyChange().changes(addressB, addressA).build()

      const deduped = dedupeAnalysisResults([first, second])

      expect(deduped).toHaveLength(2)
    })

    it('should keep malicious results with different issues', () => {
      const first = ThreatAnalysisResultBuilder.malicious()
        .issues({ [Severity.CRITICAL]: [{ description: 'Drains funds' }] })
        .build()
      const second = ThreatAnalysisResultBuilder.malicious()
        .issues({ [Severity.CRITICAL]: [{ description: 'Approves a malicious spender' }] })
        .build()

      const deduped = dedupeAnalysisResults([first, second])

      expect(deduped).toHaveLength(2)
    })

    it('should keep failed results with different errors', () => {
      const first = ThreatAnalysisResultBuilder.failedWithError().error('Reverted').build()
      const second = ThreatAnalysisResultBuilder.failedWithError().error('Timeout').build()

      const deduped = dedupeAnalysisResults([first, second])

      expect(deduped).toHaveLength(2)
    })

    it('should return results sorted by severity', () => {
      const ok = ThreatAnalysisResultBuilder.noThreat().build()
      const warn = ThreatAnalysisResultBuilder.moduleChange().build()
      const critical = ThreatAnalysisResultBuilder.malicious().build()

      const deduped = dedupeAnalysisResults([ok, warn, critical])

      expect(deduped.map((r) => r.type)).toEqual([
        ThreatStatus.MALICIOUS,
        ThreatStatus.MODULE_CHANGE,
        ThreatStatus.NO_THREAT,
      ])
    })

    it('should return empty array for empty input', () => {
      expect(dedupeAnalysisResults([])).toEqual([])
    })

    it('should not mutate the original array', () => {
      const result = ThreatAnalysisResultBuilder.ownershipChange().build()
      const original = [result, { ...result }]
      const originalCopy = [...original]

      dedupeAnalysisResults(original)

      expect(original).toEqual(originalCopy)
    })
  })

  describe('pruneOkResults', () => {
    it('should return the same array when all results are OK', () => {
      const results = [{ severity: Severity.OK }, { severity: Severity.OK }]

      const pruned = pruneOkResults(results)

      expect(pruned).toBe(results)
    })

    it('should drop OK results when any other severity is present', () => {
      const results = [{ severity: Severity.OK }, { severity: Severity.WARN }, { severity: Severity.OK }]

      const pruned = pruneOkResults(results)

      expect(pruned).toEqual([{ severity: Severity.WARN }])
    })

    it('should keep INFO results alongside higher severities', () => {
      const results = [{ severity: Severity.OK }, { severity: Severity.INFO }, { severity: Severity.CRITICAL }]

      const pruned = pruneOkResults(results)

      expect(pruned).toEqual([{ severity: Severity.INFO }, { severity: Severity.CRITICAL }])
    })

    it('should return empty array for empty input', () => {
      expect(pruneOkResults([])).toEqual([])
    })

    it('should not mutate the original array', () => {
      const original = [{ severity: Severity.OK }, { severity: Severity.WARN }]
      const originalCopy = [...original]

      pruneOkResults(original)

      expect(original).toEqual(originalCopy)
    })
  })
})
