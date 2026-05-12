import type { GradeSummary, SafeGrade, ScanResult } from '@/features/security/types'
import type { SecurityContract } from '@/features/security'
import { SAFE_GRADE_RANK } from '@/features/security/data/scanners/constants'
import { DASH } from './constants'
import type { SpaceSafeEntry } from '../../types'

/**
 * The subset of the security feature handle that the table's pure helpers need.
 * Threaded in via params instead of imported so the helpers stay testable and
 * don't reach into the feature directly — callers obtain these from useLoadFeature.
 */
export type SecurityUtils = Pick<SecurityContract, 'scanKey' | 'computeSummary' | 'severityRank'>

/** Extract a specific evidence label's value from a ScanResult. */
export const getEvidence = (
  results: Record<string, ScanResult> | undefined,
  scannerId: string,
  label: string,
): string | null => {
  const evidence = results?.[scannerId]?.evidence
  if (!evidence) return null
  for (const item of evidence) {
    if (typeof item !== 'string' && item.label === label) return item.value
  }
  return null
}

/** Format a fiat total into a compact dollar string ($1.2K / $3.4M). */
export const formatBalance = (fiatTotal?: string | null): string => {
  const value = Number(fiatTotal)
  if (!fiatTotal || !Number.isFinite(value) || value === 0) return DASH
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

/**
 * Aggregate the per-chain summaries of a multichain Safe into a single
 * GradeSummary used for the collapsed parent row's Score cell.
 */
export const getAggregateSummary = (
  safe: SpaceSafeEntry,
  scanResults: Record<string, Record<string, ScanResult>>,
  utils: SecurityUtils,
): GradeSummary | null => {
  let totalPassing = 0
  let totalApplicable = 0
  let worstGradeRank = 4
  let hasCriticalIssue = false
  let hasAny = false

  for (const chain of safe.chainEntries) {
    const key = utils.scanKey(safe.address, chain.chainId)
    const results = scanResults[key]
    if (!results) continue
    const summary = utils.computeSummary(results)
    if (!summary) continue
    hasAny = true
    totalPassing += summary.passing
    totalApplicable += summary.applicableCount
    if (summary.hasCriticalIssue) hasCriticalIssue = true
    const rank = utils.severityRank(summary.grade)
    if (rank < worstGradeRank) worstGradeRank = rank
  }

  if (!hasAny) return null
  const gradeMap = ['Critical', 'High', 'Medium', 'Low'] as const
  return {
    passing: totalPassing,
    applicableCount: totalApplicable,
    grade: gradeMap[worstGradeRank] ?? 'Low',
    hasCriticalIssue,
  }
}

/**
 * Worst SafeGrade across a multichain Safe's chain entries. Used for the collapsed
 * parent row's Status cell so it reflects the most severe chain (matching the badge
 * counting semantics in WorkspaceHealthCard).
 */
export const getAggregateSafeGrade = (
  safe: SpaceSafeEntry,
  scanResults: Record<string, Record<string, ScanResult>>,
  scanKey: SecurityContract['scanKey'],
  getSafeGrade: SecurityContract['getSafeGrade'],
): SafeGrade | null => {
  let worstRank = SAFE_GRADE_RANK.passing + 1
  let worstGrade: SafeGrade | null = null
  for (const chain of safe.chainEntries) {
    const key = scanKey(safe.address, chain.chainId)
    const results = scanResults[key]
    if (!results) continue
    const grade = getSafeGrade(results)
    const rank = SAFE_GRADE_RANK[grade]
    if (rank < worstRank) {
      worstRank = rank
      worstGrade = grade
    }
  }
  return worstGrade
}

/**
 * Any chain in a multichain Safe reporting a non-clear/non-N-A `multichain_setup`
 * result triggers the warning badge on the collapsed parent row.
 */
export const hasMultichainWarning = (
  safe: SpaceSafeEntry,
  scanResults: Record<string, Record<string, ScanResult>>,
  scanKey: SecurityContract['scanKey'],
): boolean => {
  for (const chain of safe.chainEntries) {
    const key = scanKey(safe.address, chain.chainId)
    const results = scanResults[key]
    if (!results) continue
    const multichainResult = results['multichain_setup']
    if (multichainResult && multichainResult.status !== 'clear' && multichainResult.status !== 'not_applicable') {
      return true
    }
  }
  return false
}

/** True when any of the multichain Safe's chains is currently being scanned. */
export const isAnyChainScanning = (
  safe: SpaceSafeEntry,
  scanningKeys: Set<string> | undefined,
  scanKey: SecurityContract['scanKey'],
): boolean => {
  if (!scanningKeys) return false
  return safe.chainEntries.some((c) => scanningKeys.has(scanKey(safe.address, c.chainId)))
}
