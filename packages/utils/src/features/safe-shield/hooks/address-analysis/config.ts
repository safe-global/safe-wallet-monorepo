// Address check messages
export const AddressCheckMessages = {
  ADDRESS_BOOK: { title: 'Known recipient', description: 'This address is in your address book.' },
  OWNED_SAFE: { title: 'Known recipient', description: 'This address is a Safe you own.' },
  UNKNOWN: { title: 'Unknown recipient', description: 'This address is not in your address book or a Safe you own.' },
} as const

export type AddressCheckType = keyof typeof AddressCheckMessages

// Activity thresholds for scoring
export const ACTIVITY_THRESHOLDS = { VERY_LOW: 1, LOW: 5, MODERATE: 20, HIGH: 100 } as const

// Activity messages for user-facing text
export const ActivityMessages = {
  NO_ACTIVITY: {
    title: 'No activity detected',
    description: 'This address has never made any transactions. Please verify the recipient address carefully.',
  },
  VERY_LOW_ACTIVITY: {
    title: 'Very low activity recipient',
    description: 'This address has very few transactions. Please verify the recipient address carefully.',
  },
  LOW_ACTIVITY: {
    title: 'Low activity recipient',
    description: 'This address has low transaction activity. Please verify the recipient address carefully.',
  },
  MODERATE_ACTIVITY: {
    title: 'Moderate activity recipient',
    description: 'This address has moderate transaction activity.',
  },
  HIGH_ACTIVITY: { title: 'Active recipient', description: 'This address has high transaction activity.' },
} as const
