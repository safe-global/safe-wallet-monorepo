import { EventType } from '@/services/analytics/types'

const POLICY_CATEGORY = 'policies'

export const POLICY_EVENTS = {
  POLICY_CATALOGUE_TILE_CLICKED: {
    action: 'Policy catalogue tile clicked',
    category: POLICY_CATEGORY,
  },
  /** Same action and label wording as the Safe-level `SETTINGS_EVENTS.SPENDING_LIMIT.RESET_PERIOD`, so the two compare. */
  SPENDING_LIMIT_RESET_PERIOD: {
    event: EventType.META,
    action: 'Spending limit reset period',
    category: POLICY_CATEGORY,
  },
}
