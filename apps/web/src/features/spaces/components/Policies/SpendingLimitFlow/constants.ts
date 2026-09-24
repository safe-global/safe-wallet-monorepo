/** Copy of the Create step, verbatim from the Figma frames. */
export const CREATE_STEP_TITLE = 'Create new policy'
export const FLOW_SUBTITLE = 'Spending limit'
export const FLOW_HELP_LABEL = 'Learn more about spending limits'

export const CALLOUT_TITLE = 'The spender can be anyone.'
export const CALLOUT_DESCRIPTION =
  "A bot, a teammate, or an external wallet, they don't have to be a signer. Once this transaction executes, withdrawals up to the limit you set go through with no further approvals required."
export const CALLOUT_DISMISS_LABEL = 'Dismiss'

export const SPENDER_LABEL = 'Spender'
export const SPENDER_PLACEHOLDER = 'by name or address'
export const SPENDER_HELPER_TEXT = 'The beneficiary that can spend within this limit, no signatures needed'

export const LIMIT_AMOUNT_LABEL = 'Limit amount'
export const LIMIT_AMOUNT_PLACEHOLDER = '0.0'
export const FREQUENCY_LABEL = 'Frequency'
export const ONE_TIME_HELPER_TEXT = 'One-time limit, it does not reset'
export const PRICE_UNAVAILABLE_TEXT = 'Price unavailable'

export const ADD_TOKEN_LABEL = 'Add token'
export const ADD_SPENDER_LABEL = 'Add spender'
export const REMOVE_SPENDER_LABEL = 'Remove spender'
export const REMOVE_LIMIT_LABEL = 'Remove token limit'
export const NEXT_LABEL = 'Next'

export const DUPLICATE_SPENDER_ERROR = 'This spender is already in the policy. Add the token to their existing card.'
export const DUPLICATE_TOKEN_ERROR = 'This token already has a limit for this spender'
export const EXISTING_LIMIT_ERROR = 'This spender already has a spending limit for this token'
export const EXISTING_LIMITS_LOAD_ERROR =
  "The Safe's current spending limits could not be loaded. Close this window and try again."
export const EXISTING_PAIR_IN_POLICY_ERROR =
  'A spender in this policy already has a spending limit for one of these tokens. Go back and remove that token.'

export const REVIEW_STEP_TITLE = 'Confirm policy'
