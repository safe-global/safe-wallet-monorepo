import { FEATURES } from '@/utils/chains'

export const ACTIVE_OUTREACH = { id: 2, url: 'https://wn2n6ocviur.typeform.com/to/nlQlP7lU', targetAll: true }

export const TARGETED_FEATURES = [
  { id: 3, feature: FEATURES.NESTED_SAFES },
  { id: 4, feature: FEATURES.MASS_PAYOUTS },
] as const

export const OUTREACH_LS_KEY = 'outreachPopup'
export const OUTREACH_SS_KEY = 'outreachPopup_session'

export const HOUR_IN_MS = 60 * 60 * 1000
export const MAX_ASK_AGAIN_DELAY = HOUR_IN_MS * 24
