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
  // Curation events
  CURATION_STARTED: {
    action: 'Curation started',
    category: NESTED_SAFES_CATEGORY,
  },
  CURATION_COMPLETED: {
    action: 'Curation completed',
    category: NESTED_SAFES_CATEGORY,
  },
  CURATION_MODIFIED: {
    action: 'Curation modified',
    category: NESTED_SAFES_CATEGORY,
  },
  // Similarity warning events
  SIMILARITY_WARNING_SHOWN: {
    action: 'Similarity warning shown',
    category: NESTED_SAFES_CATEGORY,
  },
  SIMILARITY_WARNING_CONFIRMED: {
    action: 'Similarity warning confirmed',
    category: NESTED_SAFES_CATEGORY,
  },
  // Intro screen events
  REVIEW_NESTED_SAFES: {
    action: 'Review nested safes clicked',
    category: NESTED_SAFES_CATEGORY,
  },
  CLICK_MORE_INDICATOR: {
    action: 'More nested safes indicator clicked',
    category: NESTED_SAFES_CATEGORY,
  },
}

export enum NESTED_SAFE_LABELS {
  header = 'header',
  sidebar = 'sidebar',
  list = 'list',
  success_screen = 'success_screen',
  first_time = 'first_time',
}
