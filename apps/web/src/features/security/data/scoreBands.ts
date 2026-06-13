/**
 * SecurityHub score ramp — the single source of truth for mapping a numeric 0–100
 * security score onto a colour band. `getScoreBand` and `GRADE_RAMP` drive the workspace
 * card gauge and the per-Safe drawer gauge, so they speak one colour language.
 */

export type ScoreBand = 'healthy' | 'review' | 'at_risk' | 'critical'

export type ScoreBandDef = {
  band: ScoreBand
  /** Inclusive lower bound of the band on the 0–100 score. */
  min: number
  /** Fill colour (gauge stroke) as an MUI palette token path. */
  color: string
}

/**
 * Ordered best → worst. Each tier's `min` is inclusive; the ranges are contiguous over 0–100.
 * Colours come from the same palette tokens the SafeGrade chip uses, so the gauge and the
 * status chips read the same colour language. There's no separate "good" tier — anything at
 * or above 85 reads as healthy.
 */
export const GRADE_RAMP: ScoreBandDef[] = [
  { band: 'healthy', min: 85, color: 'success.main' },
  { band: 'review', min: 60, color: 'review.main' },
  { band: 'at_risk', min: 40, color: 'warning.main' },
  { band: 'critical', min: 0, color: 'error.main' },
]

/** Index of the "At risk" tier — the best band a Safe with a Critical finding may show. */
const AT_RISK_INDEX = GRADE_RAMP.findIndex((b) => b.band === 'at_risk')

/**
 * Map a numeric 0–100 score to its ramp band. A Critical-severity finding caps the
 * result at "At risk" regardless of the score, so a high pass-ratio can never mask a
 * critical issue behind a green gauge.
 */
export const getScoreBand = (score: number, hasCriticalIssue = false): ScoreBandDef => {
  const matchedIndex = GRADE_RAMP.findIndex((b) => score >= b.min)
  const index = matchedIndex === -1 ? GRADE_RAMP.length - 1 : matchedIndex
  return GRADE_RAMP[hasCriticalIssue ? Math.max(index, AT_RISK_INDEX) : index]
}
