import type { GradeSummary, SafeGrade, ScanResult } from '@/features/security/types'
import type { SecurityGrade } from '@/features/security/types'
import { SAFE_GRADE_RANK, SEVERITY_RANK, type SecurityContract } from '@/features/security'
import { DASH } from './constants'
import type { SpaceSafeEntry } from '../../types'

/** Inverse of `SEVERITY_RANK` — rank index → SecurityGrade. Single source of truth for ordering. */
const SEVERITY_BY_RANK = (Object.entries(SEVERITY_RANK) as Array<[SecurityGrade, number]>)
  .sort(([, a], [, b]) => a - b)
  .map(([grade]) => grade)

/**
 * The subset of the security feature handle that the table's pure helpers need.
 * Threaded in via params instead of imported so the helpers stay testable and
 * don't reach into the feature directly — callers obtain these from useLoadFeature.
 */
export type SecurityUtils = Pick<SecurityContract, 'scanKey' | 'computeSummary' | 'severityRank'>

/** Superset used by row components: SecurityUtils + the formatters/grade helpers they render. */
export type RowSecurity = SecurityUtils & Pick<SecurityContract, 'formatTimestamp' | 'getSafeGrade'>

/** Builder returning a Safe's home URL for a given (address, chainId), or undefined if the chain has no short name. */
export type GetSafeSecurityHref = (
  address: string,
  chainId: string,
) => { pathname: string; query: { safe: string } } | undefined

/** Tally of non-passing checks for the Checks column. */
export type CheckCounts = { failed: number; warnings: number }

/**
 * Count failed (`issue`) and warning (`partial`) checks in a single Safe's scan
 * results. Mirrors the status→severity mapping used by WorkspaceHealthCard so the
 * column stays consistent with the header badges.
 */
export const countChecks = (results: Record<string, ScanResult> | undefined): CheckCounts => {
  let failed = 0
  let warnings = 0
  if (results) {
    for (const result of Object.values(results)) {
      if (result.status === 'issue') failed++
      else if (result.status === 'partial') warnings++
    }
  }
  return { failed, warnings }
}

/** Sum the failed/warning checks across all of a multichain Safe's chain entries. */
export const getAggregateCheckCounts = (
  safe: SpaceSafeEntry,
  scanResults: Record<string, Record<string, ScanResult>>,
  scanKey: SecurityContract['scanKey'],
): CheckCounts => {
  let failed = 0
  let warnings = 0
  for (const chain of safe.chainEntries) {
    const counts = countChecks(scanResults[scanKey(safe.address, chain.chainId)])
    failed += counts.failed
    warnings += counts.warnings
  }
  return { failed, warnings }
}

/**
 * Number of checks driving a Safe's grade — shown beside the grade in the Status column.
 * `at_risk`/`critical` count failing checks, `needs_attention` counts warnings, and
 * `passing` has no count (the chip just reads "Healthy").
 */
export const getStatusCount = (grade: SafeGrade | null, counts: CheckCounts): number | undefined => {
  switch (grade) {
    case 'critical':
    case 'at_risk':
      return counts.failed
    case 'needs_attention':
      return counts.warnings
    default:
      return undefined
  }
}

/**
 * Format a fiat total into a compact dollar string ($1.2K / $3.4M).
 * A zero balance renders as `$0` (not a dash) so users can distinguish
 * "known empty" from "unknown / not loaded".
 */
export const formatBalance = (fiatTotal?: string | null): string => {
  if (fiatTotal === undefined || fiatTotal === null) return DASH
  const trimmedFiatTotal = fiatTotal.trim()
  if (trimmedFiatTotal === '') return DASH
  const value = Number(trimmedFiatTotal)
  if (!Number.isFinite(value)) return DASH
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
  return {
    passing: totalPassing,
    applicableCount: totalApplicable,
    grade: SEVERITY_BY_RANK[worstGradeRank] ?? 'Low',
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
