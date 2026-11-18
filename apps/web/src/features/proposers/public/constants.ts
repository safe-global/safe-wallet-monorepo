/** TOTP interval in seconds (1 hour) */
export const TOTP_INTERVAL_SECONDS = 3600

/** Polling interval for pending delegations (milliseconds) */
export const DELEGATION_POLLING_INTERVAL_MS = 5000

/** Sent instead of the user's name. Not `''` — the Transaction Service requires a label and we can't observe whether it accepts a blank one. */
export const PROPOSER_LABEL_PLACEHOLDER = 'Proposer'

/** Validation error for the proposer address field */
export const SMART_CONTRACT_PROPOSER_ERROR = 'Cannot add a smart contract account as proposer'

/** Explanation shown on the disabled confirm button */
export const SMART_CONTRACT_PROPOSER_INFO =
  'Smart contract accounts (such as Safe accounts) cannot sign transaction proposals, so they cannot act as proposers.'
