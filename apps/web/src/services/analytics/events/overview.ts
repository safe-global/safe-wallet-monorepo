import { EventType } from '@/services/analytics/types'

const OVERVIEW_CATEGORY = 'overview'

export const OVERVIEW_EVENTS = {
  OPEN_ONBOARD: {
    action: 'Open wallet modal',
    category: OVERVIEW_CATEGORY,
  },
  SWITCH_NETWORK: {
    action: 'Switch network',
    category: OVERVIEW_CATEGORY,
  },
  SHOW_QR: {
    action: 'Show Safe QR code',
    category: OVERVIEW_CATEGORY,
  },
  COPY_ADDRESS: {
    action: 'Copy Safe address',
    category: OVERVIEW_CATEGORY,
  },
  OPEN_EXPLORER: {
    action: 'Open Safe on block explorer',
    category: OVERVIEW_CATEGORY,
  },
  ADD_TO_WATCHLIST: {
    action: 'Add Safe to watchlist',
    category: OVERVIEW_CATEGORY,
  },
  REMOVE_FROM_WATCHLIST: {
    action: 'Remove from watchlist',
    category: OVERVIEW_CATEGORY,
  },
  ADD_NEW_NETWORK: {
    action: 'Add new network',
    category: OVERVIEW_CATEGORY,
  },
  SUBMIT_ADD_NEW_NETWORK: {
    action: 'Submit add new network',
    category: OVERVIEW_CATEGORY,
  },
  CANCEL_ADD_NEW_NETWORK: {
    action: 'Cancel add new network',
    category: OVERVIEW_CATEGORY,
  },
  DELETED_FROM_WATCHLIST: {
    action: 'Deleted from watchlist',
    category: OVERVIEW_CATEGORY,
  },
  TOTAL_SAFES_OWNED: {
    action: 'Total Safes owned',
    category: OVERVIEW_CATEGORY,
    event: EventType.META,
  },
  TOTAL_SAFES_PINNED: {
    action: 'Total Safes pinned',
    category: OVERVIEW_CATEGORY,
    event: EventType.META,
  },
  SEARCH: {
    action: 'Search safes',
    category: OVERVIEW_CATEGORY,
  },
  SORT_SAFES: {
    action: 'Sort Safes',
    category: OVERVIEW_CATEGORY,
  },
  SIDEBAR: {
    action: 'Sidebar',
    category: OVERVIEW_CATEGORY,
  },
  WHATS_NEW: {
    action: "Open What's New",
    category: OVERVIEW_CATEGORY,
  },
  HELP_CENTER: {
    action: 'Open Help Center',
    category: OVERVIEW_CATEGORY,
  },
  NEW_TRANSACTION: {
    action: 'New transaction',
    category: OVERVIEW_CATEGORY,
  },
  CHOOSE_TRANSACTION_TYPE: {
    action: 'Choose transaction type',
    category: OVERVIEW_CATEGORY,
    event: EventType.CLICK,
  },
  ADD_FUNDS: {
    action: 'Add funds',
    category: OVERVIEW_CATEGORY,
    event: EventType.CLICK,
  },
  NOTIFICATION_CENTER: {
    action: 'Open Notification Center',
    category: OVERVIEW_CATEGORY,
  },
  NOTIFICATION_INTERACTION: {
    action: 'Interact with notification',
    category: OVERVIEW_CATEGORY,
  },
  SIDEBAR_RENAME: {
    action: 'Rename Safe from sidebar',
    category: OVERVIEW_CATEGORY,
  },
  SAFE_TOKEN_WIDGET: {
    action: 'Open Safe Governance App from widget',
    category: OVERVIEW_CATEGORY,
  },
  OPEN_MISSING_SIGNATURES: {
    action: 'Open transactions queue from missing signatures',
    category: OVERVIEW_CATEGORY,
  },
  OPEN_QUEUED_TRANSACTIONS: {
    action: 'Open transactions queue from queue size',
    category: OVERVIEW_CATEGORY,
  },
  EXPORT_DATA: {
    action: 'Export data',
    category: OVERVIEW_CATEGORY,
  },
  IMPORT_DATA: {
    action: 'Import data',
    category: OVERVIEW_CATEGORY,
  },
  RELAYING_HELP_ARTICLE: {
    action: 'Open relaying help article',
    category: OVERVIEW_CATEGORY,
  },
  SEP5_ALLOCATION_BUTTON: {
    action: 'Click on SEP5 allocation button',
    category: OVERVIEW_CATEGORY,
  },
  // Track clicks on links to Safe Accounts
  OPEN_SAFE: {
    action: 'Open Safe',
    category: OVERVIEW_CATEGORY,
    //label: OPEN_SAFE_LABELS
  },
  PIN_SAFE: {
    action: 'Toggle Safe pinned state',
    category: OVERVIEW_CATEGORY,
  },
  // Track clicks on links to Safe Accounts
  EXPAND_MULTI_SAFE: {
    action: 'Expand multi Safe',
    category: OVERVIEW_CATEGORY,
    //label: OPEN_SAFE_LABELS
  },
  SHOW_ALL_NETWORKS: {
    action: 'Show all networks',
    category: OVERVIEW_CATEGORY,
  },
  // Track actual Safe views
  SAFE_VIEWED: {
    event: EventType.SAFE_OPENED,
    action: 'Safe viewed',
    category: OVERVIEW_CATEGORY,
  },
  BUY_CRYPTO_BUTTON: {
    action: 'Buy crypto button',
    category: OVERVIEW_CATEGORY,
  },
  SHOW_MORE_SAFES: {
    action: 'Show more Safes',
    category: OVERVIEW_CATEGORY,
  },
  CREATE_NEW_SAFE: {
    action: 'Create new Safe',
    category: OVERVIEW_CATEGORY,
  },
  PROCEED_WITH_TX: {
    event: EventType.CLICK,
    action: 'Proceed with transaction',
    category: OVERVIEW_CATEGORY,
  },
  OPEN_STAKING_WIDGET: {
    action: 'Open staking widget from banner',
    category: OVERVIEW_CATEGORY,
  },
  HIDE_STAKING_BANNER: {
    action: 'Hide staking banner',
    category: OVERVIEW_CATEGORY,
  },
  OPEN_LEARN_MORE_STAKING_BANNER: {
    action: 'Staking banner learn more',
    category: OVERVIEW_CATEGORY,
  },
}

export enum PIN_SAFE_LABELS {
  pin = 'pin',
  unpin = 'unpin',
}

export enum OPEN_SAFE_LABELS {
  sidebar = 'sidebar',
  after_create = 'after_create',
  after_add = 'after_add',
  login_page = 'login_page',
}

export enum OVERVIEW_LABELS {
  sidebar = 'sidebar',
  quick_add = 'quick_add',
  quick_remove = 'quick_remove',
  top_bar = 'top_bar',
  welcome_page = 'welcome_page',
  login_page = 'login_page',
  settings = 'settings',
  space_list_page = 'space_list_page',
  space_page = 'space_page',
}
