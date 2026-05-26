import type { SafeGrade, ScanResult } from './types'
import type { SecurityGrade } from '../securityTypes'
import { getGrade } from '../securityScoring'
import { SCANNER_TIMEOUT_MS, SEVERITY_RANK } from './constants'

export const scanKey = (address: string, chainId: string) => `${address.toLowerCase()}:${chainId}`

/**
 * Wraps a scanner promise with a timeout. If the scanner doesn't resolve within
 * SCANNER_TIMEOUT_MS, the returned promise rejects with "Scanner timed out".
 * Protects the scan queue from hanging on a slow/unresponsive scanner.
 */
export const withScannerTimeout = <T>(promise: Promise<T>): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Scanner timed out')), SCANNER_TIMEOUT_MS)),
  ])

export const formatTimestamp = (ts?: number): string => {
  if (!ts) return '—'
  const now = Date.now()
  const diff = now - ts
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString()
}

export type GradeSummary = {
  passing: number
  applicableCount: number
  grade: SecurityGrade
  hasCriticalIssue: boolean
}

export const computeSummary = (results: Record<string, ScanResult>): GradeSummary | null => {
  const entries = Object.values(results)
  const applicable = entries.filter((r) => r.status !== 'not_applicable' && r.status !== 'inconclusive')
  if (applicable.length === 0) return null

  const passing = applicable.filter((r) => r.status === 'clear').length
  const hasCriticalIssue = applicable.some((r) => r.severity === 'Critical')
  const clearRatio = passing / applicable.length

  return { passing, applicableCount: applicable.length, grade: getGrade(clearRatio), hasCriticalIssue }
}

export const severityRank = (severity: SecurityGrade): number => SEVERITY_RANK[severity]

export const getSafeGrade = (results: Record<string, ScanResult>): SafeGrade => {
  let hasIssue = false
  let hasPartial = false

  for (const result of Object.values(results)) {
    if (result.status === 'not_applicable' || result.status === 'inconclusive') continue
    if (result.severity === 'Critical') return 'critical'
    if (result.status === 'issue') hasIssue = true
    if (result.status === 'partial') hasPartial = true
  }

  if (hasIssue) return 'at_risk'
  if (hasPartial) return 'needs_attention'
  return 'passing'
}
