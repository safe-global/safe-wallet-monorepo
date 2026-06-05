import { EventType } from '@/services/analytics/types'

const SPACE_CATEGORY = 'spaces'

export const SPACE_EVENTS = {
  SIGN_IN_BUTTON: {
    action: 'Open sign in message',
    category: SPACE_CATEGORY,
  },
  EMAIL_SIGN_IN: {
    action: 'Sign in with email',
    category: SPACE_CATEGORY,
  },
  GOOGLE_SIGN_IN: {
    action: 'Sign in with Google',
    category: SPACE_CATEGORY,
  },
  INFO_MODAL: {
    action: 'Open info dialog',
    category: SPACE_CATEGORY,
  },
  OPEN_SPACE_LIST_PAGE: {
    action: 'Open space list page',
    category: SPACE_CATEGORY,
  },
  OPEN_SPACE_DASHBOARD: {
    action: 'Open space dashboard',
    category: SPACE_CATEGORY,
  },
  WORKSPACE_CREATE_STARTED: {
    action: 'Workspace create started',
    category: SPACE_CATEGORY,
  },
  WORKSPACE_CREATED: {
    action: 'Workspace created',
    category: SPACE_CATEGORY,
  },
  ACCEPT_INVITE: {
    action: 'Open accept invitation dialog',
    category: SPACE_CATEGORY,
  },
  WORKSPACE_MEMBER_INVITE_ACCEPTED: {
    action: 'Workspace member invite accepted',
    category: SPACE_CATEGORY,
  },
  WORKSPACE_MEMBER_ROLE_CHANGED: {
    action: 'Workspace member role changed',
    category: SPACE_CATEGORY,
  },
  WORKSPACE_MEMBER_REMOVED: {
    action: 'Workspace member removed',
    category: SPACE_CATEGORY,
  },
  DECLINE_INVITE: {
    action: 'Open decline invitation dialog',
    category: SPACE_CATEGORY,
  },
  DECLINE_INVITE_SUBMIT: {
    action: 'Submit decline invitation',
    category: SPACE_CATEGORY,
  },
  VIEW_INVITING_SPACE: {
    action: 'View preview of inviting space',
    category: SPACE_CATEGORY,
  },
  ADD_MEMBER_MODAL: {
    action: 'Open add member modal',
    category: SPACE_CATEGORY,
  },
  REMOVE_MEMBER_MODAL: {
    action: 'Open remove member modal',
    category: SPACE_CATEGORY,
  },
  REMOVE_MEMBER: {
    action: 'Submit remove member',
    category: SPACE_CATEGORY,
  },
  WORKSPACE_MEMBER_INVITE_SENT: {
    action: 'Workspace member invite sent',
    category: SPACE_CATEGORY,
  },
  WORKSPACE_MEMBER_INVITE_RENEWED: {
    action: 'Workspace member invite renewed',
    category: SPACE_CATEGORY,
  },
  ADD_ACCOUNTS_MODAL: {
    action: 'Open add accounts modal',
    category: SPACE_CATEGORY,
  },
  ADD_ACCOUNTS: {
    action: 'Submit add accounts',
    category: SPACE_CATEGORY,
  },
  ADD_ACCOUNT_MANUALLY_MODAL: {
    action: 'Open add account manually modal',
    category: SPACE_CATEGORY,
  },
  ADD_ACCOUNT_MANUALLY: {
    action: 'Add account manually submit',
    category: SPACE_CATEGORY,
  },
  RENAME_ACCOUNT_MODAL: {
    action: 'Open rename account modal',
    category: SPACE_CATEGORY,
  },
  RENAME_ACCOUNT: {
    action: 'Submit rename account',
    category: SPACE_CATEGORY,
  },
  DELETE_ACCOUNT_MODAL: {
    action: 'Open delete account modal',
    category: SPACE_CATEGORY,
  },
  DELETE_ACCOUNT: {
    action: 'Submit delete account',
    category: SPACE_CATEGORY,
  },
  DELETE_SPACE_MODAL: {
    action: 'Open delete space modal',
    category: SPACE_CATEGORY,
  },
  DELETE_SPACE: {
    action: 'Submit delete space',
    category: SPACE_CATEGORY,
  },
  LEAVE_SPACE_MODAL: {
    action: 'Open leave space modal',
    category: SPACE_CATEGORY,
  },
  LEAVE_SPACE: {
    action: 'Submit leave space',
    category: SPACE_CATEGORY,
  },
  VIEW_ALL_ACCOUNTS: {
    action: 'View all accounts',
    category: SPACE_CATEGORY,
  },
  VIEW_ALL_MEMBERS: {
    action: 'View all members',
    category: SPACE_CATEGORY,
  },
  SEARCH_ACCOUNTS: {
    action: 'Search accounts',
    category: SPACE_CATEGORY,
  },
  SEARCH_MEMBERS: {
    action: 'Search members',
    category: SPACE_CATEGORY,
  },
  CREATE_SPACE_TX: {
    action: 'Open send tokens flow in space',
    category: SPACE_CATEGORY,
  },
  TOTAL_SAFE_ACCOUNTS: {
    action: 'Total safes added to space',
    category: SPACE_CATEGORY,
    event: EventType.META,
  },
  TOTAL_ACTIVE_MEMBERS: {
    action: 'Total active members in space',
    category: SPACE_CATEGORY,
    event: EventType.META,
  },
  HIDE_DASHBOARD_WIDGET: {
    action: 'Hide spaces dashboard widget',
    category: SPACE_CATEGORY,
  },
  ADD_ADDRESS: {
    action: 'Open add address dialog',
    category: SPACE_CATEGORY,
  },
  ADD_ADDRESS_SUBMIT: {
    action: 'Submit add address',
    category: SPACE_CATEGORY,
  },
  ADDRESS_BOOK_ENTRY_CREATED: {
    action: 'Address book entry created',
    category: SPACE_CATEGORY,
  },
  REMOVE_ADDRESS: {
    action: 'Open remove address dialog',
    category: SPACE_CATEGORY,
  },
  REMOVE_ADDRESS_SUBMIT: {
    action: 'Submit remove address',
    category: SPACE_CATEGORY,
  },
  IMPORT_ADDRESS_BOOK: {
    action: 'Import address book',
    category: SPACE_CATEGORY,
  },
  IMPORT_ADDRESS_BOOK_SUBMIT: {
    action: 'Submit import address book',
    category: SPACE_CATEGORY,
  },
  EDIT_ADDRESS: {
    action: 'Open edit address',
    category: SPACE_CATEGORY,
  },
  EDIT_ADDRESS_SUBMIT: {
    action: 'Submit edit address',
    category: SPACE_CATEGORY,
  },
  WORKSPACE_DASHBOARD_VIEWED: {
    action: 'Workspace dashboard viewed',
    category: SPACE_CATEGORY,
  },
  AUTH_LOGIN_SUCCEEDED: {
    action: 'Auth (SIWE / Email) success',
    category: SPACE_CATEGORY,
  },
  AUTH_LOGIN_FAILED: {
    action: 'Auth (SIWE / Email) failure',
    category: SPACE_CATEGORY,
  },
  AUTH_LOGGED_OUT: {
    action: 'Auth logged out',
    category: SPACE_CATEGORY,
  },
  SAFE_SELECTED: {
    action: 'Safe selected in space',
    category: SPACE_CATEGORY,
  },
  CHAIN_SWITCHED: {
    action: 'Chain switched in space',
    category: SPACE_CATEGORY,
  },
  WORKSPACE_SAFE_LINK_STARTED: {
    action: 'Workspace safe link started',
    category: SPACE_CATEGORY,
  },
  WORKSPACE_SAFE_LINKED: {
    action: 'Workspace safe linked',
    category: SPACE_CATEGORY,
  },
  WORKSPACE_SAFE_UNLINKED: {
    action: 'Workspace safe unlinked',
    category: SPACE_CATEGORY,
  },
  WORKSPACE_SWITCHED: {
    action: 'Workspace switched',
    category: SPACE_CATEGORY,
  },
  ACCOUNTS_WIDGET_CLICKED: {
    action: 'Accounts widget clicked',
    category: SPACE_CATEGORY,
  },
  PENDING_TX_WIDGET_CLICKED: {
    action: 'Pending TX widget clicked',
    category: SPACE_CATEGORY,
  },
  TRANSACTION_INITIATED: {
    action: 'Transaction initiated',
    category: SPACE_CATEGORY,
  },
  ONBOARDING_WIZARD: {
    action: 'Onboarding wizard item clicked',
    category: SPACE_CATEGORY,
  },
  WALLET_SWITCHED: {
    action: 'Wallet switched in space',
    category: SPACE_CATEGORY,
  },
  WALLET_DISCONNECTED: {
    action: 'Wallet disconnected in space',
    category: SPACE_CATEGORY,
  },
}

export enum SPACE_LABELS {
  space_list_page = 'space_list_page',
  safe_dashboard_banner = 'safe_dashboard_banner',
  space_selector = 'space_selector',
  accounts_page = 'accounts_page',
  preview_banner = 'preview_banner',
  space_dashboard_card = 'space_dashboard_card',
  members_page = 'members_page',
  member_list = 'member_list',
  invite_list = 'invite_list',
  add_accounts_modal = 'add_accounts_modal',
  space_settings = 'space_settings',
  space_context_menu = 'space_context_menu',
  space_breadcrumbs = 'space_breadcrumbs',
  security_page = 'security_page',
}
