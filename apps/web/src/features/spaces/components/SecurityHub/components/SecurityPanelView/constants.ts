import type { StrengthLevel } from '@/features/security/types'

/** Sentence beneath the header score for each strength level. */
export const STRENGTH_DESCRIPTIONS: Record<StrengthLevel, string> = {
  Strong: 'Your account is well configured.',
  Moderate: 'Your account has room for improvement.',
  Weak: 'Your account has security gaps that should be addressed.',
  Critical: 'Your account has critical issues that need immediate attention.',
}

/** Header panel background color per strength level. */
export const GRADE_BG_BY_STRENGTH: Record<StrengthLevel, string> = {
  Strong: 'success.background',
  Moderate: 'warning.background',
  Weak: 'error.background',
  Critical: 'error.background',
}

/** Stagger delay per row within a section (seconds) — used by SectionPanel. */
export const ROW_STAGGER = 0.04
