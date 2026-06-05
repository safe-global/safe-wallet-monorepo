/**
 * SecurityHub score ramp — the single source of truth for mapping a numeric 0–100
 * security score onto a colour band. `getScoreBand` and `GRADE_RAMP` drive the gauge,
 * panel header and per-Safe score dot, so they all speak one colour language.
 */

export type ScoreBand = 'healthy' | 'good' | 'review' | 'at_risk' | 'critical'

export type ScoreBandDef = {
  band: ScoreBand
  /** Display label shown beside the gauge. */
  label: string
  /** Inclusive lower bound of the band on the 0–100 score. */
  min: number
  /** Fill colour (gauge stroke / status dot) as an MUI palette token path. */
  color: string
  /** Soft panel-header background — an MUI token path or a colour-mix tint. */
  background: string
  /** One-line summary shown under the gauge in the panel header. */
  description: string
}

/** Ordered best → worst. Each tier's `min` is inclusive; the ranges are contiguous over 0–100. */
export const GRADE_RAMP: ScoreBandDef[] = [
  {
    band: 'healthy',
    label: 'Healthy',
    min: 90,
    color: 'success.main',
    background: 'success.background',
    description: 'Your account is well configured.',
  },
  {
    band: 'good',
    label: 'Good',
    min: 85,
    color: 'score.good',
    background: 'color-mix(in srgb, var(--color-score-good) 12%, transparent)',
    description: 'Your account is in good shape, with only minor improvements left.',
  },
  {
    band: 'review',
    label: 'Review',
    min: 60,
    color: 'score.review',
    background: 'color-mix(in srgb, var(--color-score-review) 12%, transparent)',
    description: 'Your account has room for improvement.',
  },
  {
    band: 'at_risk',
    label: 'At risk',
    min: 40,
    color: 'warning.main',
    background: 'warning.background',
    description: 'Your account has security gaps that should be addressed.',
  },
  {
    band: 'critical',
    label: 'Critical',
    min: 0,
    color: 'error.main',
    background: 'error.background',
    description: 'Your account has critical issues that need immediate attention.',
  },
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
