const ORG_CATEGORY = 'organizations'

export const ORG_EVENTS = {
  SIGN_IN_BUTTON: {
    action: 'Open sign in message',
    category: ORG_CATEGORY,
  },
  INFO_MODAL: {
    action: 'Open info dialog',
    category: ORG_CATEGORY,
  },
  OPEN_ORGS_LIST_PAGE: {
    action: 'Open orgs list page',
    category: ORG_CATEGORY,
  },
  OPEN_CREATE_ORG_MODAL: {
    action: 'Open create org dialog',
    category: ORG_CATEGORY,
  },
  CREATE_ORG: {
    action: 'Submit org creation',
    category: ORG_CATEGORY,
  },
  ACCEPT_INVITE: {
    action: 'Open accept invitation dialog',
    category: ORG_CATEGORY,
  },
  ACCEPT_INVITE_SUBMIT: {
    action: 'Submit accept invitation',
    category: ORG_CATEGORY,
  },
  DECLINE_INVITE: {
    action: 'Open decline invitation dialog',
    category: ORG_CATEGORY,
  },
  DECLINE_INVITE_SUBMIT: {
    action: 'Submit decline invitation',
    category: ORG_CATEGORY,
  },
  VIEW_INVITING_ORG: {
    action: 'View preview of inviting org',
    category: ORG_CATEGORY,
  },
  OPEN_ADD_MEMBER_MODAL: {
    action: 'Open add member modal',
    category: ORG_CATEGORY,
  },
  OPEN_REMOVE_MEMBER_MODAL: {
    action: 'Open remove member modal',
    category: ORG_CATEGORY,
  },
  REMOVE_MEMBER: {
    action: 'Submit remove member',
    category: ORG_CATEGORY,
  },
  ADD_MEMBER: {
    action: 'Submit add member',
    category: ORG_CATEGORY,
  },
  OPEN_ADD_ACCOUNTS_MODAL: {
    action: 'Open add accounts modal',
    category: ORG_CATEGORY,
  },
  ADD_ACCOUNTS: {
    action: 'Submit add accounts',
    category: ORG_CATEGORY,
  },
  ADD_ACCOUNT_MANUALLY: {
    action: 'Add account address manually',
    category: ORG_CATEGORY,
  },
  DELETE_ORGANIZATION: {
    action: 'Delete organization',
    category: ORG_CATEGORY,
  },
  VIEW_ALL_ACCOUNTS: {
    action: 'View all accounts',
    category: ORG_CATEGORY,
  },
  VIEW_ALL_MEMBERS: {
    action: 'View all members',
    category: ORG_CATEGORY,
  },
  SEARCH_ACCOUNTS: {
    action: 'Search accounts',
    category: ORG_CATEGORY,
  },
  SEARCH_MEMBERS: {
    action: 'Search members',
    category: ORG_CATEGORY,
  },
}

export enum ORG_LABELS {
  orgs_list_page = 'orgs_list_page',
  safe_dashboard_banner = 'safe_dashboard_banner',
  info_modal = 'info_modal',
  org_selector = 'org_selector',
  accounts_page = 'accounts_page',
  preview_banner = 'preview_banner',
  org_dashboard = 'org_dashboard',
  org_dashboard_card = 'org_dashboard_card',
  members_page = 'members_page',
  member_list = 'member_list',
  invite_list = 'invite_list',
  add_accounts_modal = 'add_accounts_modal',
}
