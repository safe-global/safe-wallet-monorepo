import type { SecurityGrade } from './securityTypes'

export const getGrade = (clearRatio: number): SecurityGrade => {
  if (clearRatio >= 0.83) return 'Low'
  if (clearRatio >= 0.5) return 'Medium'
  if (clearRatio >= 0.17) return 'High'
  return 'Critical'
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

// Strength-based framing (positive: higher = better)
export type StrengthLevel = 'Strong' | 'Moderate' | 'Weak' | 'Critical'

export const getStrengthLevel = (clearRatio: number, hasCriticalIssue = false): StrengthLevel => {
  const base: StrengthLevel =
    clearRatio >= 0.83 ? 'Strong' : clearRatio >= 0.5 ? 'Moderate' : clearRatio >= 0.17 ? 'Weak' : 'Critical'

  // A Critical severity finding caps strength at Weak regardless of clear ratio
  if (hasCriticalIssue && (base === 'Strong' || base === 'Moderate')) return 'Weak'

  return base
}

const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  Strong: 'success.main',
  Moderate: 'warning.main',
  Weak: 'error.main',
  Critical: 'error.main',
}

export const getStrengthColor = (level: StrengthLevel): string => STRENGTH_COLORS[level]
