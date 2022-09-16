import { EventType } from '@/services/analytics/types'

const ASSETS_CATEGORY = 'assets'

export const ASSETS_EVENTS = {
  CURRENCY_MENU: {
    action: 'Currency menu',
    category: ASSETS_CATEGORY,
  },
  CHANGE_CURRENCY: {
    event: EventType.META,
    action: 'Change currency',
    category: ASSETS_CATEGORY,
  },
  DIFFERING_TOKENS: {
    event: EventType.META,
    action: 'Tokens',
    category: ASSETS_CATEGORY,
  },
  SEND: {
    action: 'Send',
    category: ASSETS_CATEGORY,
  },
}
