import type { SecurityGrade } from './securityTypes'

// Strength-based framing (positive: higher = better)
export type StrengthLevel = 'Strong' | 'Moderate' | 'Weak' | 'Critical'

/** Single source of truth for the grade/strength tier each clear-ratio threshold maps to. */
export const SCORING_THRESHOLDS: Array<{ minRatio: number; grade: SecurityGrade; strength: StrengthLevel }> = [
  { minRatio: 0.83, grade: 'Low', strength: 'Strong' },
  { minRatio: 0.5, grade: 'Medium', strength: 'Moderate' },
  { minRatio: 0.17, grade: 'High', strength: 'Weak' },
  { minRatio: 0, grade: 'Critical', strength: 'Critical' },
]

const matchThreshold = (clearRatio: number) =>
  SCORING_THRESHOLDS.find((t) => clearRatio >= t.minRatio) ?? SCORING_THRESHOLDS[SCORING_THRESHOLDS.length - 1]

export const getGrade = (clearRatio: number): SecurityGrade => matchThreshold(clearRatio).grade

export const getStrengthLevel = (clearRatio: number, hasCriticalIssue = false): StrengthLevel => {
  const base = matchThreshold(clearRatio).strength

  // A Critical severity finding caps strength at Weak regardless of clear ratio
  if (hasCriticalIssue && (base === 'Strong' || base === 'Moderate')) return 'Weak'

  return base
}

const GRADE_COLORS: Record<SecurityGrade, string> = {
  Low: 'success.main',
  Medium: 'warning.main',
  High: 'error.main',
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

const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  Strong: 'success.main',
  Moderate: 'warning.main',
  Weak: 'error.main',
  Critical: 'error.main',
}

export const getStrengthColor = (level: StrengthLevel): string => STRENGTH_COLORS[level]
