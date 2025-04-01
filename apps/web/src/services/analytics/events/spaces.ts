import { EventType } from '@/services/analytics'

const SPACE_CATEGORY = 'spaces'

export const SPACE_EVENTS = {
  SIGN_IN_BUTTON: {
    action: 'Open sign in message',
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
  CREATE_SPACE_MODAL: {
    action: 'Open create space dialog',
    category: SPACE_CATEGORY,
  },
  CREATE_SPACE: {
    action: 'Submit space creation',
    category: SPACE_CATEGORY,
  },
  ACCEPT_INVITE: {
    action: 'Open accept invitation dialog',
    category: SPACE_CATEGORY,
  },
  ACCEPT_INVITE_SUBMIT: {
    action: 'Submit accept invitation',
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
  ADD_MEMBER: {
    action: 'Submit add member',
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
}

export enum SPACE_LABELS {
  space_list_page = 'space_list_page',
  safe_dashboard_banner = 'safe_dashboard_banner',
  info_modal = 'info_modal',
  space_selector = 'space_selector',
  accounts_page = 'accounts_page',
  preview_banner = 'preview_banner',
  space_dashboard = 'space_dashboard',
  space_dashboard_card = 'space_dashboard_card',
  members_page = 'members_page',
  member_list = 'member_list',
  invite_list = 'invite_list',
  add_accounts_modal = 'add_accounts_modal',
  space_settings = 'space_settings',
  space_context_menu = 'space_context_menu',
  space_breadcrumbs = 'space_breadcrumbs',
}
