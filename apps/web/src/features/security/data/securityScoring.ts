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
