const HYPERNATIVE_CATEGORY = 'hypernative'

export const HYPERNATIVE_EVENTS = {
  GUARD_LEARN_MORE: {
    action: 'guardLearnMore',
    category: HYPERNATIVE_CATEGORY,
  },
  GUARD_START: {
    action: 'guardStart',
    category: HYPERNATIVE_CATEGORY,
  },
  GUARD_FORM_SUBMITTED: {
    action: 'guardFormSubmitted',
    category: HYPERNATIVE_CATEGORY,
  },
  REVIEW_REPORT_CLICKED: {
    action: 'reviewReportClicked',
    category: HYPERNATIVE_CATEGORY,
  },
}

export enum HYPERNATIVE_SOURCE {
  Dashboard = 'Dashboard',
  AccountCreation = 'Account creation',
  Settings = 'Settings',
  NewTransaction = 'New transaction',
  Tutorial = 'Tutorial',
}
