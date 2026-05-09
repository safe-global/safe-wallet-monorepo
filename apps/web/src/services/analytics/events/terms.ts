import { EventType } from '@/services/analytics/types'

const TERMS_CATEGORY = 'terms'

export const TERMS_EVENTS = {
  ACCEPT_SAFE_LABS_TERMS: {
    action: 'Accept Safe Labs terms',
    category: TERMS_CATEGORY,
    event: EventType.CLICK,
  },
}
