import { CookieAndTermType } from '@/store/cookiesAndTermsSlice'

export const COOKIE_AND_TERM_WARNING: Record<CookieAndTermType, string> = {
  [CookieAndTermType.TERMS]: '',
  [CookieAndTermType.NECESSARY]: '',
  [CookieAndTermType.UPDATES]: `You attempted to open the "What's new" section but need to accept the "Beamer" cookies first.`,
  [CookieAndTermType.ANALYTICS]: '',
}

export const styles = {
  warningText: {
    mb: 2,
    color: 'warning.background',
  },
  introText: {
    mb: 2,
  },
  optionsGrid: {
    alignItems: 'center',
    gap: 4,
  },
  optionBox: {
    mb: 2,
  },
  buttonsGrid: {
    alignItems: 'center',
    justifyContent: 'center',
    mt: 4,
    gap: 2,
  },
  warningIcon: {
    mb: -0.4,
  },
} as const
