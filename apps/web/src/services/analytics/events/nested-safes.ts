const NESTED_SAFES_CATEGORY = 'nested-safes'

export const NESTED_SAFE_EVENTS = {
  OPEN_LIST: {
    action: 'Open nested Safe list',
    category: NESTED_SAFES_CATEGORY,
  },
  OPEN_NESTED_SAFE: {
    action: 'Open nested Safe',
    category: NESTED_SAFES_CATEGORY,
  },
  SHOW_ALL: {
    action: 'Show all',
    category: NESTED_SAFES_CATEGORY,
  },
  ADD: {
    action: 'Add',
    category: NESTED_SAFES_CATEGORY,
  },
  RENAME: {
    action: 'Rename',
    category: NESTED_SAFES_CATEGORY,
  },
}

export enum NESTED_SAFE_LABELS {
  header = 'header',
  sidebar = 'sidebar',
  list = 'list',
  success_screen = 'success_screen',
}
