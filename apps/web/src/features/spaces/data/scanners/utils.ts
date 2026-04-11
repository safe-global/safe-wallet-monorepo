import type { ScanResult } from './types'
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
  atRisk: number
  needsAttention: number
  healthy: number
  grade: ReturnType<typeof getGrade>
}

export const computeSummary = (results: Record<string, ScanResult>): GradeSummary | null => {
  const entries = Object.values(results)
  if (entries.length === 0) return null
  let atRisk = 0
  let needsAttention = 0
  let healthy = 0
  for (const r of entries) {
    if (r.status === 'issue') atRisk++
    else if (r.status === 'partial') needsAttention++
    else healthy++
  }
  return { atRisk, needsAttention, healthy, grade: getGrade(healthy / entries.length) }
}

export const severityRank = (severity: string): number => {
  const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
  return order[severity] ?? 4
}
