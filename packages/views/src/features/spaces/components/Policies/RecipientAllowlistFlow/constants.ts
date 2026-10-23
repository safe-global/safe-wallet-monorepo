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

export const RECIPIENTS_SECTION_TITLE = 'Who can receive funds'
export const RECIPIENTS_CALLOUT_TITLE = 'Only transactions to the recipients selected below will be allowed.'
export const RECIPIENTS_CALLOUT_DESCRIPTION = 'Every other transaction will be blocked.'
export const RECIPIENTS_EMPTY_TEXT = 'Recipients will show here.'
export const ADD_RECIPIENT_LABEL = 'Add a recipient'
export const IN_ADDRESS_BOOK_LABEL = 'In your address book'

export const RECIPIENT_NAME_LABEL = 'Name (optional)'
export const RECIPIENT_ADDRESS_LABEL = 'Address or ENS'
export const RECIPIENT_FALLBACK_NAME = 'New recipient'
export const RECIPIENT_NEXT_LABEL = 'Next'
export const RECIPIENT_ADD_CONFIRM_LABEL = 'Add recipient'
export const RECIPIENT_REMOVE_LABEL = 'Remove'

export const ADDRESS_BOOK_TRIGGER_LABEL = 'Add from address book'
export const ADDRESS_BOOK_SEARCH_LABEL = 'Search contacts'
export const ADDRESS_BOOK_EMPTY_TEXT = 'No contacts found.'
export const ADDRESS_BOOK_CONFIRM_LABEL = 'Add'
export const LOCAL_CONTACTS_LABEL = 'Local contacts'
export const LOCAL_CONTACTS_TOOLTIP = "Saved in this browser only. Other members of the Workspace can't see them."
export const getSpaceContactsTooltip = (spaceName: string): string =>
  `Shared with everyone in ${spaceName}. Only Workspace admins can add or change these contacts.`
export const FALLBACK_SPACE_NAME = 'your Workspace'

export const IDENTICON_SIZE = 24
export const getAllowlistAccountLabel = (name: string, chainName: string): string => `${name} on ${chainName}`

export const NATIVE_POLICY_UNAVAILABLE_ERROR = 'Native token allowlists are not available on this chain'
export const TOO_MANY_CONFIGURATIONS_ERROR = 'This allowlist is too large. Remove some tokens or recipients.'
export const GUARD_READ_ERROR = "Couldn't check the Safe's policy guard. Try again."
export const GUARD_UNAVAILABLE_ERROR = 'Allowlists are not available on this chain.'
export const GUARD_NOT_SUPPORTED_ERROR = "This Safe account's guard setup doesn't support allowlists."

export const REVIEW_SUMMARY_DESCRIPTION = 'Check the details below before you sign.'
export const REVIEW_ACCOUNT_LABEL = 'Applies to'
export const REVIEW_TOKENS_LABEL = 'Allowed tokens'
export const getReviewRecipientsLabel = (count: number): string => `Allowed recipients (${count})`
export const getNextSignersText = (names: string): string =>
  `${names} will be asked to sign next. Nothing changes until it's executed.`
export const POLICY_GUARD_NAME = 'SafePolicyGuard'
export const getRuleTitle = (index: number, count: number): string => `Rule ${index + 1} of ${count}`
export const RULE_POLICY_LABEL = 'Policy'
export const RULE_TARGET_LABEL = 'Applies to'
export const RULE_RECIPIENTS_LABEL = 'Allowed recipients'
export const POLICY_LABELS = {
  erc20: 'Token withdraw allowlist',
  native: 'Native transfers',
} as const
export const SAVE_CONFIGURATION_ERROR = "Couldn't save the allowlist. Try again."
