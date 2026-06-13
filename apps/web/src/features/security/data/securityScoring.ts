import type { SecurityGrade } from './securityTypes'

/**
 * Per-check severity grade thresholds (clear-ratio → SecurityGrade).
 * The workspace score → colour band mapping lives in `scoreBands.ts`.
 */
export const SCORING_THRESHOLDS: Array<{ minRatio: number; grade: SecurityGrade }> = [
  { minRatio: 0.83, grade: 'Low' },
  { minRatio: 0.5, grade: 'Medium' },
  { minRatio: 0.17, grade: 'High' },
  { minRatio: 0, grade: 'Critical' },
]

const matchThreshold = (clearRatio: number) =>
  SCORING_THRESHOLDS.find((t) => clearRatio >= t.minRatio) ?? SCORING_THRESHOLDS[SCORING_THRESHOLDS.length - 1]

export const getGrade = (clearRatio: number): SecurityGrade => matchThreshold(clearRatio).grade

// Colours follow the SecurityHub score ramp: green → amber → orange → red.
// Aligned with the SafeGrade chip palette so the gauge, chips and per-check rows speak
// one colour language.
const GRADE_COLORS: Record<SecurityGrade, string> = {
  Low: 'success.main',
  Medium: 'review.main',
  High: 'warning.main',
  Critical: 'error.main',
}

const GRADE_BG_COLORS: Record<SecurityGrade, string> = {
  Low: 'success.background',
  Medium: 'warning.background',
  High: 'error.background',
  Critical: 'error.background',
}

export const getGradeColor = (grade: SecurityGrade): string => GRADE_COLORS[grade]

export const getGradeBgColor = (grade: SecurityGrade): string => GRADE_BG_COLORS[grade]
