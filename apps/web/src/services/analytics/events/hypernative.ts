export const HYPERNATIVE_CATEGORY = 'hypernative'

export const HYPERNATIVE_EVENTS = {
  GUARDIAN_BANNER_VIEWED: {
    action: 'Guardian Banner Viewed',
    category: HYPERNATIVE_CATEGORY,
  },
  GUARDIAN_FORM_VIEWED: {
    action: 'Guardian Form Viewed',
    category: HYPERNATIVE_CATEGORY,
  },
  GUARDIAN_FORM_STARTED: {
    action: 'Guardian Form Started',
    category: HYPERNATIVE_CATEGORY,
  },
  GUARDIAN_FORM_SUBMITTED: {
    action: 'Guardian Form Submitted',
    category: HYPERNATIVE_CATEGORY,
  },
  SECURITY_REPORT_CLICKED: {
    action: 'Security Report Clicked',
    category: HYPERNATIVE_CATEGORY,
  },
  GUARDIAN_BANNER_DISMISSED: {
    action: 'Guardian Banner Dismissed',
    category: HYPERNATIVE_CATEGORY,
  },
}

export enum HYPERNATIVE_SOURCE {
  Dashboard = 'Dashboard',
  Settings = 'Settings',
  NewTransaction = 'New transaction',
  Tutorial = 'Tutorial',
  Queue = 'Queue',
  History = 'History',
}
