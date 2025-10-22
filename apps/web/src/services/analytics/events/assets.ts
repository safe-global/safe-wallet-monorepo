import { EventType } from '@/services/analytics/types'

const ASSETS_CATEGORY = 'assets'

export const ASSETS_EVENTS = {
  CURRENCY_MENU: {
    action: 'Currency menu',
    category: ASSETS_CATEGORY,
  },
  OPEN_TOKEN_LIST_MENU: {
    action: 'Open token list menu',
    category: ASSETS_CATEGORY,
  },
  OPEN_PROVIDER_MENU: {
    action: 'Open provider menu',
    category: ASSETS_CATEGORY,
  },
  OPEN_SETTINGS_MODAL: {
    action: 'Open assets settings modal',
    category: ASSETS_CATEGORY,
  },
  CHANGE_CURRENCY: {
    event: EventType.META,
    action: 'Change currency',
    category: ASSETS_CATEGORY,
  },
  CHANGE_PROVIDER: {
    event: EventType.META,
    action: 'Change provider',
    category: ASSETS_CATEGORY,
  },
  DIFFERING_TOKENS: {
    event: EventType.META,
    action: 'Tokens',
    category: ASSETS_CATEGORY,
  },
  HIDDEN_TOKENS: {
    event: EventType.META,
    action: 'Hidden tokens',
    category: ASSETS_CATEGORY,
  },
  SHOW_HIDDEN_ASSETS: {
    action: 'Show hidden assets',
    category: ASSETS_CATEGORY,
  },
  SEND: {
    action: 'Send',
    category: ASSETS_CATEGORY,
  },
  HIDE_TOKEN: {
    action: 'Hide single token',
    category: ASSETS_CATEGORY,
  },
  CANCEL_HIDE_DIALOG: {
    action: 'Cancel hide dialog',
    category: ASSETS_CATEGORY,
  },
  SAVE_HIDE_DIALOG: {
    action: 'Save hide dialog',
    category: ASSETS_CATEGORY,
  },
  DESELECT_ALL_HIDE_DIALOG: {
    action: 'Deselect all hide dialog',
    category: ASSETS_CATEGORY,
  },
  SHOW_DEFAULT_TOKENS: {
    action: 'Show default tokens',
    category: ASSETS_CATEGORY,
  },
  SHOW_ALL_TOKENS: {
    action: 'Show all tokens',
    category: ASSETS_CATEGORY,
  },
}
