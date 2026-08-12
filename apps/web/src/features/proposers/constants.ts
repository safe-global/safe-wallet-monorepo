/** TOTP interval in seconds (1 hour) */
export const TOTP_INTERVAL_SECONDS = 3600

/** Polling interval for pending delegations (milliseconds) */
export const DELEGATION_POLLING_INTERVAL_MS = 5000

/** Validation error for the proposer address field */
export const SMART_CONTRACT_PROPOSER_ERROR = 'Cannot add a smart contract account as proposer'

/** Shown when submitting an edit of an existing smart contract proposer */
export const SMART_CONTRACT_PROPOSER_EDIT_ERROR =
  'This proposer is a smart contract account, which cannot sign transaction proposals. Remove it instead.'

/** Explanation shown on the disabled confirm button */
export const SMART_CONTRACT_PROPOSER_INFO =
  'Smart contract accounts (such as Safe accounts) cannot sign transaction proposals, so they cannot act as proposers.'
