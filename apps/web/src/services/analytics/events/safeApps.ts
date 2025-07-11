import { EventType } from '@/services/analytics/types'

export const SAFE_APPS_CATEGORY = 'safe-apps'
export const SAFE_APPS_SDK_CATEGORY = 'safe-apps-sdk'
export const SAFE_APPS_ANALYTICS_CATEGORY = 'safe-apps-analytics'

const SAFE_APPS_EVENT_DATA = {
  event: EventType.SAFE_APP,
  category: SAFE_APPS_CATEGORY,
}

export const SAFE_APPS_EVENTS = {
  OPEN_APP: {
    ...SAFE_APPS_EVENT_DATA,
    action: 'Open Safe App',
  },
  APP_LAUNCHED: {
    ...SAFE_APPS_EVENT_DATA,
    action: 'App Launched',
  },
  PIN: {
    ...SAFE_APPS_EVENT_DATA,
    action: 'Pin Safe App',
  },
  UNPIN: {
    ...SAFE_APPS_EVENT_DATA,
    action: 'Unpin Safe App',
  },
  COPY_SHARE_URL: {
    ...SAFE_APPS_EVENT_DATA,
    action: 'Copy Share URL',
  },
  SEARCH: {
    ...SAFE_APPS_EVENT_DATA,
    action: 'Search for Safe App',
  },
  ADD_CUSTOM_APP: {
    ...SAFE_APPS_EVENT_DATA,
    action: 'Add custom Safe App',
  },
  OPEN_TRANSACTION_MODAL: {
    ...SAFE_APPS_EVENT_DATA,
    action: 'Open Transaction modal',
  },
  PROPOSE_TRANSACTION: {
    ...SAFE_APPS_EVENT_DATA,
    action: 'Propose Transaction',
  },
  PROPOSE_TRANSACTION_REJECTED: {
    ...SAFE_APPS_EVENT_DATA,
    action: 'Propose Transaction Rejected',
  },
  SHARED_APP_LANDING: {
    ...SAFE_APPS_EVENT_DATA,
    action: 'Shared App landing page visited',
  },
  SHARED_APP_CHAIN_ID: {
    ...SAFE_APPS_EVENT_DATA,
    action: 'Shared App chainId',
  },
  SHARED_APP_OPEN_DEMO: {
    ...SAFE_APPS_EVENT_DATA,
    action: 'Open demo safe from shared app',
  },
  SHARED_APP_OPEN_AFTER_SAFE_CREATION: {
    ...SAFE_APPS_EVENT_DATA,
    action: 'Open shared app after Safe creation',
  },

  // SDK
  SAFE_APP_SDK_METHOD_CALL: {
    ...SAFE_APPS_EVENT_DATA,
    category: SAFE_APPS_SDK_CATEGORY,
    action: 'SDK method call',
  },
}

export enum SAFE_APPS_LABELS {
  dashboard = 'dashboard',
  apps_pinned = 'apps_pinned',
  apps_featured = 'apps_featured',
  apps_all = 'apps_all',
  apps_custom = 'apps_custom',
  apps_sidebar = 'apps_sidebar',
}
