import { MIN_POLICY_GUARD_SAFE_VERSION } from '@safe-global/utils/features/policy-guard/constants'

/** How long a policy change waits before it applies. */
export const POLICY_CHANGE_DELAY = '24 hours'

export const FLOW_SUBTITLE = 'Allowlist'

export const NO_ELIGIBLE_SAFES_TITLE = 'No eligible Safes'
export const NO_ELIGIBLE_SAFES_DESCRIPTION = `Recipient allowlists need a Safe account on a supported network, running Safe v${MIN_POLICY_GUARD_SAFE_VERSION} or newer.`

export const RECIPIENT_DUPLICATE_ERROR = 'Already in the list'
export const RECIPIENT_IS_SAFE_ERROR = 'Cannot add the Safe account itself as recipient'
export const RECIPIENT_RESERVED_ERROR = 'This recipient address is not valid'

export const SUMMARY_NO_ACCOUNT_TITLE = 'Pick a Safe account to start.'
export const SUMMARY_NO_ACCOUNT_DESCRIPTION = 'Then choose which tokens it can send and who can receive them.'
export const SUMMARY_DESCRIPTION = 'Anything you leave out will be blocked.'
export const SUMMARY_DETAILS_LABEL = 'When this takes effect'
export const SUMMARY_DETAILS_GUARD_ENABLED = `The Safe policy guard is already enabled, so these changes wait ${POLICY_CHANGE_DELAY} after execution, then need an activation step before they apply.`
export const SUMMARY_DETAILS = `These changes take effect as soon as this transaction is executed. Further changes will take ${POLICY_CHANGE_DELAY} to apply.`

export const TOKENS_SECTION_TITLE = 'Which tokens can be sent'
export const TOKENS_NO_ACCOUNT_DESCRIPTION = 'Pick a Safe account to choose from its tokens.'
export const TOKENS_CALLOUT_TITLE = 'Only transactions of the tokens selected below will be allowed.'
export const TOKENS_CALLOUT_DESCRIPTION = 'Every other transaction will be blocked.'
export const TOKENS_EMPTY_TEXT = 'Tokens in this account will show here.'
export const TOKENS_LOAD_ERROR_TEXT = 'Could not load the tokens in this account.'
export const SELECT_ALL_LABEL = 'Select all'
export const DESELECT_ALL_LABEL = 'Deselect all'
export const ADD_TOKEN_LABEL = 'Add a token'
export const CANCEL_ADD_TOKEN_LABEL = 'Cancel adding a token'
export const ADD_TOKEN_CONFIRM_LABEL = 'Add token'
export const ADD_TOKEN_PLACEHOLDER = 'Search by name or address'
