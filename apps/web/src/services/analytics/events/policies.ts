import { EventType } from '@/services/analytics/types'

const POLICY_CATEGORY = 'policies'

export const POLICY_EVENTS = {
  POLICY_CATALOGUE_TILE_CLICKED: {
    action: 'Policy catalogue tile clicked',
    category: POLICY_CATEGORY,
  },
  POLICY_UPSELL_UPGRADE_CLICKED: {
    action: 'Policy upsell upgrade clicked',
    category: POLICY_CATEGORY,
  },
  ADD_POLICY_DIALOG_CLOSED: {
    action: 'Add policy dialog closed',
    category: POLICY_CATEGORY,
  },
  PROPOSER_SUBMITTED: {
    action: 'Proposer submitted',
    category: POLICY_CATEGORY,
  },
  SPENDING_LIMIT_SET: {
    action: 'Spending limit set',
    category: POLICY_CATEGORY,
  },
  SPENDING_LIMIT_TX_CONFIRMED: {
    action: 'Spending limit tx confirmed',
    category: POLICY_CATEGORY,
  },
  SPENDING_LIMIT_TX_SIGNED: {
    action: 'Spending limit tx signed',
    category: POLICY_CATEGORY,
  },
  /** Same action and label wording as the Safe-level `SETTINGS_EVENTS.SPENDING_LIMIT.RESET_PERIOD`, so the two compare. */
  SPENDING_LIMIT_RESET_PERIOD: {
    event: EventType.META,
    action: 'Spending limit reset period',
    category: POLICY_CATEGORY,
  },
}

export const ADD_POLICY_DISMISSED_LABEL = 'dismissed'
