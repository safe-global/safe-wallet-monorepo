import { MIN_POLICY_GUARD_SAFE_VERSION } from '@safe-global/utils/features/policy-guard/constants'

/** How long a policy change waits before it applies. */
export const POLICY_CHANGE_DELAY = '24 hours'

export const FLOW_SUBTITLE = 'Recipient allowlist'
export const FLOW_HELP_LABEL = 'Learn more about recipient allowlists'

export const NO_ELIGIBLE_SAFES_TITLE = 'No eligible Safes'
export const NO_ELIGIBLE_SAFES_DESCRIPTION = `Recipient allowlists need a Safe account on a supported network, running Safe v${MIN_POLICY_GUARD_SAFE_VERSION} or newer.`

export const TOKENS_LABEL = 'Tokens'
export const TOKEN_LABEL = 'Token'
export const TOKENS_HELPER_TEXT = 'Each token can only be sent to the recipients below.'
export const ADD_TOKEN_LABEL = 'Add token'
export const REMOVE_TOKEN_LABEL = 'Remove token'
export const NATIVE_TOKEN_UNRESTRICTED_REASON =
  "Native coin transfers fall back to this Safe's allow-by-default policy, so an allowlist can't restrict them."

export const RECIPIENTS_LABEL = 'Recipients'
export const RECIPIENT_LABEL = 'Recipient'
export const RECIPIENT_PLACEHOLDER = 'Recipient address or ENS'
export const RECIPIENTS_HELPER_TEXT = 'Only these addresses can receive the tokens above.'
export const ADD_RECIPIENT_LABEL = 'Add recipient'
export const REMOVE_RECIPIENT_LABEL = 'Remove recipient'
export const DUPLICATE_RECIPIENT_ERROR = 'This recipient is already in the allowlist'

export const ALLOWLIST_CALLOUT_TITLE = 'Transfers are restricted to this allowlist'
export const ALLOWLIST_CALLOUT_DESCRIPTION =
  'The selected tokens can only be sent to the recipients below. Transfers to anyone else are blocked onchain.'

export const NATIVE_REVOKED_LABEL = 'No longer allowed'
export const NATIVE_REVOKED_HELPER_TEXT =
  'These recipients can currently receive the native coin. This allowlist removes that permission.'
