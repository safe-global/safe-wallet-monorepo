import { MIN_POLICY_GUARD_SAFE_VERSION } from '@safe-global/utils/features/policy-guard/constants'

/** How long a policy change waits before it applies. */
export const POLICY_CHANGE_DELAY = '24 hours'

export const FLOW_SUBTITLE = 'Recipient allowlist'
export const FLOW_HELP_LABEL = 'Learn more about recipient allowlists'

export const NO_ELIGIBLE_SAFES_TITLE = 'No eligible Safes'
export const NO_ELIGIBLE_SAFES_DESCRIPTION = `Recipient allowlists need a Safe account on a supported network, running Safe v${MIN_POLICY_GUARD_SAFE_VERSION} or newer.`
