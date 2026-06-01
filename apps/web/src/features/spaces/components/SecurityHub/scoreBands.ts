import type { SafeGrade } from '@/features/security/types'

/**
 * Five-tier security score ramp. A numeric score (0–100) maps to a band with a
 * human label, a vivid color (dots / bars / fills) and a darker text color
 * (accessible labels on light surfaces). Colors resolve from the `--score-*`
 * CSS variables defined in `shadcn.css` (light + dark).
 *
 *   90–100  Healthy   green
 *   85–89   Good      lime
 *   60–84   Review    yellow
 *   40–59   At risk   orange
 *    0–39   Critical  red
 *
 * The green family (lime + green) intentionally starts at 85 — a 75 should not
 * read as "good/green".
 */
export type ScoreBand = {
  key: 'healthy' | 'good' | 'review' | 'at_risk' | 'critical'
  label: string
  color: string
  textColor: string
  min: number
}

const BANDS: ScoreBand[] = [
  { key: 'healthy', label: 'Healthy', min: 90, color: 'var(--score-healthy)', textColor: 'var(--score-healthy-text)' },
  { key: 'good', label: 'Good', min: 85, color: 'var(--score-good)', textColor: 'var(--score-good-text)' },
  { key: 'review', label: 'Review', min: 60, color: 'var(--score-review)', textColor: 'var(--score-review-text)' },
  { key: 'at_risk', label: 'At risk', min: 40, color: 'var(--score-at-risk)', textColor: 'var(--score-at-risk-text)' },
  {
    key: 'critical',
    label: 'Critical',
    min: 0,
    color: 'var(--score-critical)',
    textColor: 'var(--score-critical-text)',
  },
]

/** Maps a 0–100 score to its band. Highest matching threshold wins. */
export const getScoreBand = (score: number): ScoreBand => BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1]

/**
 * Per-Safe grade → ramp color. Grades are a 4-tier classification (no "Good"
 * band), so they reuse the matching ramp colors. Keeps tags, breakdown cards and
 * the composition bar on the same palette as the numeric score.
 */
export const GRADE_RAMP: Record<SafeGrade, { color: string; textColor: string }> = {
  critical: { color: 'var(--score-critical)', textColor: 'var(--score-critical-text)' },
  at_risk: { color: 'var(--score-at-risk)', textColor: 'var(--score-at-risk-text)' },
  needs_attention: { color: 'var(--score-review)', textColor: 'var(--score-review-text)' },
  passing: { color: 'var(--score-healthy)', textColor: 'var(--score-healthy-text)' },
}
