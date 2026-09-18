/** Row labels, verbatim from the frame. */
export const APPLIES_TO_LABEL = 'Applies to'
export const SPENDER_LABEL = 'Spender'
export const LIMITS_LABEL = 'Limits'

type CanonicalFrequency = {
  /** Row label, e.g. `Weekly`. */
  label: string
  /** Callout adjective, e.g. `weekly`. */
  adjective: string
}

/** The four production reset periods, keyed by minutes. Any other value falls back to the form's own option label. */
export const CANONICAL_FREQUENCIES: Readonly<Partial<Record<string, CanonicalFrequency>>> = {
  '0': { label: 'One time only', adjective: 'one-time' },
  '1440': { label: 'Daily', adjective: 'daily' },
  '10080': { label: 'Weekly', adjective: 'weekly' },
  '43200': { label: 'Monthly', adjective: 'monthly' },
}

export const CALLOUT_TITLE_PREFIX = 'You are giving'
export const CALLOUT_NOUN_SINGULAR = 'spending limit'
export const CALLOUT_NOUN_PLURAL = 'spending limits'
export const CALLOUT_DESCRIPTION_SINGULAR =
  'Once this transaction executes, withdrawals up to the limit you set go through with no further approvals required.'
export const CALLOUT_DESCRIPTION_PLURAL =
  'Once this transaction executes, withdrawals up to the limits you set go through with no further approvals required.'
