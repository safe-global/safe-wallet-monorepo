import { MIN_POLICY_GUARD_SAFE_VERSION } from '@safe-global/utils/features/policy-guard/constants'

/** How long a policy change waits before it applies. */
export const POLICY_CHANGE_DELAY = '24 hours'

export const FLOW_SUBTITLE = 'Recipient allowlist'
export const FLOW_HELP_LABEL = 'Learn more about recipient allowlists'

export const NO_ELIGIBLE_SAFES_TITLE = 'No eligible Safes'
export const NO_ELIGIBLE_SAFES_DESCRIPTION = `Recipient allowlists need a Safe account on a supported network, running Safe v${MIN_POLICY_GUARD_SAFE_VERSION} or newer.`

export const RECIPIENT_DUPLICATE_ERROR = 'Already in the list'
export const RECIPIENT_IS_SAFE_ERROR = 'Cannot add the Safe account itself as recipient'
export const RECIPIENT_RESERVED_ERROR = 'This recipient address is not valid'

export const SUMMARY_NO_ACCOUNT_TITLE = 'Pick a Safe account to start.'
export const SUMMARY_NO_ACCOUNT_DESCRIPTION = 'Then choose which tokens it can send and who can receive them.'
export const SUMMARY_DESCRIPTION = 'Anything you leave out will be blocked.'
export const SUMMARY_DETAILS_LABEL = 'When this takes effect'
export const SUMMARY_DETAILS = `These changes take effect as soon as this transaction is executed. Further changes will take ${POLICY_CHANGE_DELAY} to apply.`
