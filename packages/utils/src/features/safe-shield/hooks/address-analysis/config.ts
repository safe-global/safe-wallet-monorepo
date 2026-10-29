import { AnalysisResult, RecipientStatus, Severity } from '../../types'

// Address check messages
export const AddressCheckMessages = {
  ADDRESS_BOOK: { title: 'Known recipient', description: 'This address is in your address book.' },
  OWNED_SAFE: { title: 'Known recipient', description: 'This address is a Safe you own.' },
  UNKNOWN: { title: 'Unknown recipient', description: 'This address is not in your address book or a Safe you own.' },
} as const

export type AddressCheckType = keyof typeof AddressCheckMessages

// Activity threshold for low activity
export const ACTIVITY_THRESHOLD_LOW = 5

// Above this many addresses the activity check is skipped to avoid flooding the RPC provider
export const MAX_ACTIVITY_CHECK_ADDRESSES = 50

// Maximum number of concurrent activity lookups
export const ACTIVITY_CHECK_CONCURRENCY = 5

export const LowActivityAnalysisResult: AnalysisResult<RecipientStatus.LOW_ACTIVITY> = {
  type: RecipientStatus.LOW_ACTIVITY,
  severity: Severity.WARN,
  title: 'Low activity recipient',
  description: 'This address has few transactions.',
}
