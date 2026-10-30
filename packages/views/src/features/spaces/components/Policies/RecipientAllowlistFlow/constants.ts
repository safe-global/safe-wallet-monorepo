import {
  MIN_POLICY_GUARD_SAFE_VERSION,
  POLICY_GUARD_DELAY_SECONDS,
} from '@safe-global/utils/features/policy-guard/constants'
import { formatDurationFromMilliseconds } from '@safe-global/utils/utils/formatters'

/** How long a policy change waits before it applies, e.g. `3 minutes`. */
export const formatPolicyChangeDelay = (delaySeconds: number): string =>
  formatDurationFromMilliseconds(delaySeconds * 1_000, ['days', 'hours', 'minutes'])

/** The same delay as an adjective, e.g. `3-minute`, for "a 3-minute wait". */
export const formatPolicyChangeDelayAdjective = (delaySeconds: number): string =>
  formatPolicyChangeDelay(delaySeconds).replace(/(\d+) (day|hour|minute)s?/g, '$1-$2')

/** The delay of the guard the setup installs */
export const POLICY_CHANGE_DELAY = formatPolicyChangeDelay(POLICY_GUARD_DELAY_SECONDS)

export const FLOW_SUBTITLE = 'Allowlist'

export const NO_ELIGIBLE_SAFES_TITLE = 'No eligible Safes'
export const NO_ELIGIBLE_SAFES_DESCRIPTION = `Recipient allowlists need a Safe account on a supported network, running Safe v${MIN_POLICY_GUARD_SAFE_VERSION} or newer.`

export const RECIPIENT_DUPLICATE_ERROR = 'Already in the list'
export const RECIPIENT_IS_SAFE_ERROR = 'Cannot add the Safe account itself as recipient'
export const RECIPIENT_RESERVED_ERROR = 'This recipient address is not valid'

export const SUMMARY_NO_ACCOUNT_TITLE = 'Pick a Safe account to start.'
export const SUMMARY_NO_ACCOUNT_DESCRIPTION = 'Then choose which tokens it can send and who can receive them.'
export const SUMMARY_DESCRIPTION = 'Transfers of these tokens to anyone else will be blocked.'
export const SUMMARY_DETAILS_LABEL = 'When this takes effect'
export const SUMMARY_DETAILS_GUARD_ENABLED = `The Safe policy guard is already enabled, so these changes wait ${POLICY_CHANGE_DELAY} after execution, then need an activation step before they apply.`
export const SUMMARY_DETAILS = `These changes take effect as soon as this transaction is executed. Further changes will take ${POLICY_CHANGE_DELAY} to apply.`

export const TOKENS_SECTION_TITLE = 'Which tokens can be sent'
export const TOKENS_NO_ACCOUNT_DESCRIPTION = 'Pick a Safe account to choose from its tokens.'
export const TOKENS_CALLOUT_TITLE = 'The tokens selected below can only be sent to the recipients on this allowlist.'
export const TOKENS_CALLOUT_DESCRIPTION = 'Sending them to anyone else will be blocked.'
export const TOKENS_EMPTY_TEXT = 'Tokens in this account will show here.'
export const TOKENS_LOAD_ERROR_TEXT = 'Could not load the tokens in this account.'
export const SELECT_ALL_LABEL = 'Select all'
export const DESELECT_ALL_LABEL = 'Deselect all'
export const ADD_TOKEN_LABEL = 'Add a token'
export const CANCEL_ADD_TOKEN_LABEL = 'Cancel adding a token'
export const CONFIRM_TOKEN_LABEL = 'Add matching token'
export const ADD_TOKEN_PLACEHOLDER = 'Search by name or address'

export const RECIPIENTS_SECTION_TITLE = 'Who can receive funds'
export const RECIPIENTS_CALLOUT_TITLE = 'Only the recipients selected below can receive the tokens on this allowlist.'
export const RECIPIENTS_CALLOUT_DESCRIPTION = 'Sending those tokens to anyone else will be blocked.'
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

export const ALLOWLIST_UNAVAILABLE_ERROR = 'Allowlists are not available on this chain.'
export const ZERO_ADDRESS_RECIPIENT_ERROR = "The zero address can't be an allowlist recipient."
export const TOO_MANY_CONFIGURATIONS_ERROR = 'This allowlist is too large. Remove some tokens or recipients.'
export const EMPTY_ALLOWLIST_ERROR = 'Select at least one token and one recipient.'
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
export const RULE_DELEGATE_CALL_LABEL = 'Delegate call'
export const RULE_REVOKED_RECIPIENTS_LABEL = 'Removed recipients'
export const POLICY_LABELS = {
  erc20: 'Token withdraw allowlist',
  erc20Revoke: 'Token withdraw allowlist',
  native: 'Native transfers',
  allow: 'Allow everything else',
  allowCall: 'Always allowed',
  deny: 'Block everything else',
  multiSend: 'Batched transactions',
  removal: 'None, the rule is deleted',
  unknown: 'Other policy',
} as const
export const FALLBACK_TARGET_NAME = 'Any address'

export const REVIEW_FALLBACK_LABEL = 'Every other action'
export const REVIEW_FALLBACK_ALLOW =
  'Stays allowed. Only transfers of the selected tokens to recipients not on the list are blocked.'
export const BLOCKED_LABEL = 'Blocked'
export const reviewConsentLabel = (safeName: string, changeDelay: string): string =>
  `I understand that ${safeName} will only be able to do what this allowlist allows, and that every later change takes ${changeDelay} to apply.`
export const REVIEW_CONSENT_ERROR = 'Tick the box to continue.'

export const ALLOWLIST_GAPS_TITLE = "What this allowlist doesn't cover"
export const ALLOWLIST_GAP_APPROVALS =
  'Token approvals are not restricted. An address you approve can still move the selected tokens with transferFrom.'
export const ALLOWLIST_GAP_NATIVE =
  'Native token transfers to recipients not on the list stay allowed, because everything else stays allowed.'
export const ALLOWLIST_GAP_DELEGATE_CALLS =
  'Delegate calls are not restricted, except Safe batches, whose transactions are each checked against the allowlist.'

export const SAVE_CONFIGURATION_ERROR = "Couldn't save the allowlist. Try again."

export const EXISTING_POLICIES_STEP_TITLE = 'Existing policies'
export const getRestrictedSpendingLimitsTitle = (count: number): string =>
  count === 1
    ? "Your spending limit will follow this allowlist's rules."
    : `Your ${count} spending limits will follow this allowlist's rules.`
export const RESTRICTED_SPENDING_LIMITS_DESCRIPTION = 'They can only send allowed tokens to allowed recipients.'
export const getBlockedSpendingLimitsTitle = (count: number): string =>
  `${count} spending ${count === 1 ? 'limit' : 'limits'} will be blocked by this allowlist.`
const onceApplied = (isEdit: boolean): string => (isEdit ? 'Once the change applies' : 'Once this allowlist is active')
export const getBlockedSpendingLimitDescription = (
  spender: string,
  amount: string,
  symbol: string,
  isEdit = false,
): string =>
  `${spender} can send up to ${amount} to any address today. ${onceApplied(isEdit)}, it can't send ${symbol} anymore.`
export const getBlockedSpendingLimitsDescription = (isEdit = false): string =>
  `They can send their tokens to any address today. ${onceApplied(isEdit)}, they can't send them anymore.`
export const getSpendingLimitsGroupTitle = (safeName: string): string => `Spending limits on ${safeName}`
export const FOLLOWS_ALLOWLIST_LABEL = 'Follows the allowlist'
export const WILL_BE_BLOCKED_LABEL = 'Will be blocked'
export const getTokenInAllowlistText = (symbol: string): string => `${symbol} is in this allowlist`
export const getTokenNotInAllowlistText = (symbol: string): string => `${symbol} isn't in this allowlist`
export const SPENDING_LIMITS_ACKNOWLEDGEMENT_LABEL = 'I understand how this allowlist changes these spending limits.'
export const getSpendingLimitsLoadErrorTitle = (safeName: string): string =>
  `Couldn't load the spending limits on ${safeName}`
export const SPENDING_LIMITS_LOAD_ERROR_DESCRIPTION =
  'Check your connection and try again. You can continue once they load.'
export const SPENDING_LIMITS_LOADING_TITLE = 'Loading the spending limits'
export const NO_SPENDING_LIMITS_TITLE = 'This Safe account has no spending limits.'
export const RETRY_LABEL = 'Retry'

export const REMOVE_REVIEW_STEP_TITLE = 'Remove allowlist'
export const REMOVE_SUMMARY_TITLE = 'Request to remove the allowlist.'
export const removeSummaryDescription = (changeDelay: string): string =>
  `After ${changeDelay}, a second transaction needs to be executed to delete its rules, and a third to take the guard off. Until the second one is executed, the allowlist stays active.`
export const APPLY_REMOVAL_REVIEW_STEP_TITLE = 'Apply removal'
export const APPLY_REMOVAL_SUMMARY_TITLE = 'Apply the removal to delete the allowlist.'
export const APPLY_REMOVAL_SUMMARY_DESCRIPTION =
  "The waiting period is over. Once this transaction is executed, the allowlist's rules are deleted and the guard can be removed. Until it is, this Safe account can't send anything."
export const REMOVE_GUARD_REVIEW_STEP_TITLE = 'Remove guard'
export const REMOVE_GUARD_SUMMARY_TITLE = 'Take the Safe policy guard off.'
export const REMOVE_GUARD_SUMMARY_DESCRIPTION =
  'Once this transaction is executed, transactions are no longer checked against a policy. You can set up a new allowlist at any time.'

export const APPLY_REVIEW_STEP_TITLE = 'Apply allowlist'
export const APPLY_SUMMARY_TITLE = 'Apply the allowlist to turn it on.'
export const APPLY_SUMMARY_DESCRIPTION =
  'The waiting period is over. Once this transaction is executed, every transfer of an allowlisted token is checked against it.'

export const EDIT_LABEL = 'Edit'
export const getEditSummaryTitle = (account: string): string => `You're editing the allowlist on ${account}.`
export const EDIT_SUMMARY_DESCRIPTION = 'Anything you deselect will be blocked once the change applies.'
export const EDIT_SUMMARY_DETAILS = 'Any signer can cancel the change before it applies.'
export const EDIT_TOKENS_DESCRIPTION =
  'These are the tokens the allowlist allows today. Add a token or deselect one to change it.'
export const EDIT_RECIPIENTS_DESCRIPTION =
  'These are the recipients the allowlist allows today. Add a recipient or deselect one to change it.'
export const EDIT_SAFE_LOAD_ERROR_TEXT = 'Could not load this Safe account.'
export const getEditReviewDescription = (delay: string): string =>
  `Check the details below before you sign. This starts a ${delay} wait, and a second transaction will be needed to apply the changes to the policy.`
