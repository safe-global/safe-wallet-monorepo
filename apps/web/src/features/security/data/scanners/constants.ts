import type { SafeVersion } from '@safe-global/types-kit'
import type { SecurityGrade } from '../securityTypes'
import type { SafeGrade } from './types'

/** Maximum time a single scanner is allowed to run before being rejected. */
export const SCANNER_TIMEOUT_MS = 15_000

/** Minimum USD balance to recommend enterprise-grade protection. Mirrors hypernative's threshold. */
export const HIGH_VALUE_THRESHOLD_USD = 1_000_000

/** Safe versions to check against when validating deployment addresses. */
export const KNOWN_SAFE_VERSIONS: SafeVersion[] = ['1.0.0', '1.1.1', '1.2.0', '1.3.0', '1.4.1']

/** Sort order for severities — lower number ranks first (worst issues bubble to top). */
export const SEVERITY_RANK: Record<SecurityGrade, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
}

/**
 * Sort order for SafeGrade — overall per-Safe assessment. Distinct from `SEVERITY_RANK`,
 * which ranks per-check `SecurityGrade`. Lower number = worse, so a "worst-grade-first"
 * scan picks the smallest rank across a multichain Safe's chain entries.
 */
export const SAFE_GRADE_RANK: Record<SafeGrade, number> = {
  critical: 0,
  at_risk: 1,
  needs_attention: 2,
  passing: 3,
}

/** Score thresholds that bucket a numeric score into a SecurityGrade. */
export const SEVERITY_SCORE_THRESHOLDS: Array<{ minScore: number; severity: SecurityGrade }> = [
  { minScore: 80, severity: 'Low' },
  { minScore: 50, severity: 'Medium' },
  { minScore: 20, severity: 'High' },
  { minScore: 0, severity: 'Critical' },
]

/**
 * Derives a SecurityGrade from a numeric score (0–100) via SEVERITY_SCORE_THRESHOLDS.
 *
 * Pass `excluded: true` for results with status `inconclusive` or `not_applicable` —
 * these are filtered from the aggregate score and per-Safe grade, so their score is
 * decorative. Forcing 'Low' keeps them visually neutral and prevents them from
 * outranking real findings in severity-sorted views, matching the documented matrix
 * (see Security Hub — Documentation, "Excluded check rendering").
 */
export const getSeverityFromScore = (score: number, options: { excluded?: boolean } = {}): SecurityGrade => {
  if (options.excluded) return 'Low'
  const match = SEVERITY_SCORE_THRESHOLDS.find((t) => score >= t.minScore)
  return match?.severity ?? 'Critical'
}
