import {
  MIN_POLICY_GUARD_SAFE_VERSION,
  POLICY_GUARD_DELAY_SECONDS,
} from '@safe-global/utils/features/policy-guard/constants'
import { formatDurationFromMilliseconds } from '@safe-global/utils/utils/formatters'

/** How long a policy change waits before it applies, e.g. `3 minutes`. */
export const formatPolicyChangeDelay = (delaySeconds: number): string =>
  formatDurationFromMilliseconds(delaySeconds * 1_000, ['days', 'hours', 'minutes', 'seconds']) || '0 seconds'

/** The delay of the guard the setup installs */
export const POLICY_CHANGE_DELAY = formatPolicyChangeDelay(POLICY_GUARD_DELAY_SECONDS)

export const FLOW_SUBTITLE = 'Allowlist'

export const NO_ELIGIBLE_SAFES_TITLE = 'No eligible Safes'
export const NO_ELIGIBLE_SAFES_DESCRIPTION = `Recipient allowlists need a Safe account on a supported network, running Safe v${MIN_POLICY_GUARD_SAFE_VERSION} or newer.`

export const RECIPIENT_DUPLICATE_ERROR = 'Already in the list'
export const RECIPIENT_IS_SAFE_ERROR = 'Cannot add the Safe account itself as recipient'
export const RECIPIENT_RESERVED_ERROR = 'This recipient address is not valid'

export const SUMMARY_DETAILS_LABEL = 'When this takes effect'

export const SPENDING_LIMIT_TOKEN_HINT =
  "This Safe account has a spending limit for this token. Add the token, so the allowlist doesn't block the spending limit."
export const SELECT_ALL_LABEL = 'Select all'

export const SPACE_CONTACTS_LABEL = 'Contacts of'
export const LOCAL_CONTACTS_LABEL = 'Local contacts'
export const LOCAL_CONTACTS_TOOLTIP = "Saved in this browser only. Other members of the Workspace can't see them."
export const getSpaceContactsTooltip = (spaceName: string): string =>
  `Shared with everyone in ${spaceName}. Only Workspace admins can add or change these contacts.`
export const FALLBACK_SPACE_NAME = 'your Workspace'

export const getAllowlistAccountLabel = (name: string, chainName: string): string => `${name} on ${chainName}`

export const BLOCKED_LABEL = 'Blocked'

export const RETRY_LABEL = 'Retry'

export const getEditSummaryTitle = (account: string): string => `You're editing the allowlist on ${account}.`
export const EDIT_SUMMARY_DESCRIPTION = 'Anything you deselect will be blocked once the change applies.'
export const EDIT_SUMMARY_DETAILS = 'Any signer can cancel the change before it applies.'
