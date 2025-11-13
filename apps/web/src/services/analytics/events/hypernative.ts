const HYPERNATIVE_CATEGORY = 'hypernative'

export const HYPERNATIVE_EVENTS = {
  GUARD_LEARN_MORE: {
    action: 'Guardian Form Viewed',
    category: HYPERNATIVE_CATEGORY,
  },
  GUARD_START: {
    action: 'Guardian Form Started',
    category: HYPERNATIVE_CATEGORY,
  },
  GUARD_FORM_SUBMITTED: {
    action: 'Guardian Form Submitted',
    category: HYPERNATIVE_CATEGORY,
  },
  REVIEW_REPORT_CLICKED: {
    action: 'Security Report Clicked',
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
