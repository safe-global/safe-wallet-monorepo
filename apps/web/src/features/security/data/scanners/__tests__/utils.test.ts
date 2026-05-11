import { computeSummary, severityRank, scanKey, formatTimestamp } from '../utils'
import type { ScanResult } from '../types'

const makeScanResult = (overrides: Partial<ScanResult> = {}): ScanResult => ({
  status: 'clear',
  severity: 'Low',
  score: 100,
  evidence: [],
  remediation: '',
  lastChecked: new Date().toISOString(),
  ...overrides,
})

describe('scanKey', () => {
  it('produces address:chainId format', () => {
    expect(scanKey('0xABC', '1')).toBe('0xABC:1')
  })
})

describe('severityRank', () => {
  it('maps Critical → 0', () => expect(severityRank('Critical')).toBe(0))
  it('maps High → 1', () => expect(severityRank('High')).toBe(1))
  it('maps Medium → 2', () => expect(severityRank('Medium')).toBe(2))
  it('maps Low → 3', () => expect(severityRank('Low')).toBe(3))
})

describe('formatTimestamp', () => {
  it('returns dash for undefined', () => {
    expect(formatTimestamp(undefined)).toBe('—')
  })

  it('returns dash for 0', () => {
    expect(formatTimestamp(0)).toBe('—')
  })

  it('returns "Just now" for < 60s ago', () => {
    expect(formatTimestamp(Date.now() - 30_000)).toBe('Just now')
  })

  it('returns minutes ago for < 1h', () => {
    const result = formatTimestamp(Date.now() - 5 * 60_000)
    expect(result).toBe('5m ago')
  })

  it('returns hours ago for < 24h', () => {
    const result = formatTimestamp(Date.now() - 3 * 3_600_000)
    expect(result).toBe('3h ago')
  })

  it('returns formatted date for older timestamps', () => {
    const result = formatTimestamp(Date.now() - 2 * 86_400_000)
    expect(result).toMatch(/\d+\/\d+\/\d+/)
  })
})

describe('computeSummary', () => {
  it('returns null for empty results', () => {
    expect(computeSummary({})).toBeNull()
  })

  it('returns null when all results are not_applicable', () => {
    const results = {
      a: makeScanResult({ status: 'not_applicable' }),
      b: makeScanResult({ status: 'not_applicable' }),
    }
    expect(computeSummary(results)).toBeNull()
  })

  it('returns null when all results are inconclusive', () => {
    const results = {
      a: makeScanResult({ status: 'inconclusive' }),
      b: makeScanResult({ status: 'inconclusive' }),
    }
    expect(computeSummary(results)).toBeNull()
  })

  it('excludes not_applicable and inconclusive from counts', () => {
    const results = {
      a: makeScanResult({ status: 'clear' }),
      b: makeScanResult({ status: 'not_applicable' }),
      c: makeScanResult({ status: 'inconclusive' }),
      d: makeScanResult({ status: 'issue', severity: 'High' }),
    }
    const summary = computeSummary(results)
    expect(summary).not.toBeNull()
    expect(summary!.passing).toBe(1)
    expect(summary!.applicableCount).toBe(2)
  })

  it('counts only clear as passing', () => {
    const results = {
      a: makeScanResult({ status: 'clear' }),
      b: makeScanResult({ status: 'partial', severity: 'Medium' }),
      c: makeScanResult({ status: 'issue', severity: 'High' }),
    }
    const summary = computeSummary(results)
    expect(summary!.passing).toBe(1)
    expect(summary!.applicableCount).toBe(3)
  })

  it('detects hasCriticalIssue when any result has Critical severity', () => {
    const results = {
      a: makeScanResult({ status: 'clear' }),
      b: makeScanResult({ status: 'issue', severity: 'Critical' }),
    }
    expect(computeSummary(results)!.hasCriticalIssue).toBe(true)
  })

  it('hasCriticalIssue is false when no Critical results', () => {
    const results = {
      a: makeScanResult({ status: 'clear' }),
      b: makeScanResult({ status: 'issue', severity: 'High' }),
    }
    expect(computeSummary(results)!.hasCriticalIssue).toBe(false)
  })

  it('computes grade Low for >= 83% clear ratio', () => {
    const results: Record<string, ScanResult> = {}
    for (let i = 0; i < 6; i++) results[`clear${i}`] = makeScanResult({ status: 'clear' })
    results.issue = makeScanResult({ status: 'issue', severity: 'High' })
    // 6/7 = 85.7% → Low
    expect(computeSummary(results)!.grade).toBe('Low')
  })

  it('computes grade Medium for >= 50% clear ratio', () => {
    const results = {
      a: makeScanResult({ status: 'clear' }),
      b: makeScanResult({ status: 'issue', severity: 'High' }),
    }
    // 1/2 = 50% → Medium
    expect(computeSummary(results)!.grade).toBe('Medium')
  })

  it('computes grade High for >= 17% clear ratio', () => {
    const results = {
      a: makeScanResult({ status: 'clear' }),
      b: makeScanResult({ status: 'issue', severity: 'High' }),
      c: makeScanResult({ status: 'issue', severity: 'High' }),
      d: makeScanResult({ status: 'issue', severity: 'High' }),
      e: makeScanResult({ status: 'issue', severity: 'High' }),
    }
    // 1/5 = 20% → High
    expect(computeSummary(results)!.grade).toBe('High')
  })

  it('computes grade Critical for < 17% clear ratio', () => {
    const results: Record<string, ScanResult> = {}
    for (let i = 0; i < 7; i++) results[`issue${i}`] = makeScanResult({ status: 'issue', severity: 'High' })
    // 0/7 = 0% → Critical
    expect(computeSummary(results)!.grade).toBe('Critical')
  })

  it('handles mixed statuses with N/A and inconclusive correctly', () => {
    const results = {
      clear1: makeScanResult({ status: 'clear' }),
      clear2: makeScanResult({ status: 'clear' }),
      partial: makeScanResult({ status: 'partial', severity: 'Medium' }),
      na: makeScanResult({ status: 'not_applicable' }),
      inconclusive: makeScanResult({ status: 'inconclusive' }),
      issue: makeScanResult({ status: 'issue', severity: 'Critical' }),
    }
    const summary = computeSummary(results)
    expect(summary!.passing).toBe(2)
    expect(summary!.applicableCount).toBe(4) // clear1, clear2, partial, issue
    expect(summary!.hasCriticalIssue).toBe(true)
    // 2/4 = 50% → Medium
    expect(summary!.grade).toBe('Medium')
  })
})
