import type { ScanResult } from './types'
import type { SecurityGrade } from '../securityTypes'
import { getGrade } from '../securityScoring'

export const scanKey = (address: string, chainId: string) => `${address}:${chainId}`

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

export const severityRank = (severity: string): number => {
  const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
  return order[severity] ?? 4
}
