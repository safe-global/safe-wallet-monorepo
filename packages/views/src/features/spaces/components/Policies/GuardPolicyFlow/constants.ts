/** Shared by the three guard-enforced policy flows, so the flows cannot drift from one another. */

export const GUARD_POLICY_CREATE_STEP_TITLE = 'Create new policy'

export const GUARD_POLICY_REVIEW_STEP_TITLE = 'Confirm policy'

export const GUARD_POLICY_NEXT_LABEL = 'Next'

export const APPLIES_TO_LABEL = 'Applies to'

export const NO_POLICY_CONTRACTS_ERROR = "The policy engine isn't available for this Safe's network yet."

export const UNKNOWN_GUARD_WARNING_TITLE = 'This replaces the Safe’s current guard'

export const UNKNOWN_GUARD_WARNING_TEXT =
  'This Safe already has a different transaction guard. Confirming this policy installs the policy guard in its place.'

export const TIME_LOCKED_TITLE = 'This change is time-locked'

export const TIME_LOCKED_TEXT =
  'This Safe already uses the policy guard, so this transaction requests the change. It can be applied from the Policies page once the guard’s delay has passed.'

export const REQUEST_CAP_REACHED_TEXT =
  'This Safe has too many pending policy requests. Apply or cancel some to see this one’s details.'

/** Each policy's own copy: the flow header, its intro dialog and its review callout. */
export type GuardPolicyCopy = {
  title: string
  description: string
  proceedLabel: string
  /** Browser-wide, as the other intros: the intro explains the concept, not a Safe. */
  introSeenKey: string
}

export const TOKEN_ALLOWLIST_COPY: GuardPolicyCopy = {
  title: 'Token recipient allowlist',
  description: 'Restrict who each token can be sent to. Transfers to anyone else are blocked onchain.',
  proceedLabel: 'Set up token allowlist',
  introSeenKey: 'tokenAllowlistIntroSeen',
}

export const MULTISEND_COPY: GuardPolicyCopy = {
  title: 'Batched transactions',
  description: 'Apply your other policies to every call inside a batch, not just the batch itself.',
  proceedLabel: 'Set up batched transactions',
  introSeenKey: 'multiSendPolicyIntroSeen',
}

export const SAFE_MANAGEMENT_COPY: GuardPolicyCopy = {
  title: 'Safe management',
  description: 'Choose which signer, module and guard changes this Safe account still allows.',
  proceedLabel: 'Set up Safe management',
  introSeenKey: 'safeManagementIntroSeen',
}

// ─── Token recipient allowlist ──────────────────────────────────────────────

export const TOKENS_LABEL = 'Tokens'
export const TOKEN_LABEL = 'Token'
export const TOKENS_HELPER_TEXT = 'Each token can only be sent to the recipients below.'
export const ADD_TOKEN_LABEL = 'Add token'
export const REMOVE_TOKEN_LABEL = 'Remove token'
export const DUPLICATE_TOKEN_ERROR = 'This token is already in the policy'
export const NATIVE_TOKEN_REASON = "The native coin isn't an ERC-20 token, so this policy can't restrict it."

export const RECIPIENTS_LABEL = 'Recipients'
export const RECIPIENT_LABEL = 'Recipient'
export const RECIPIENT_PLACEHOLDER = 'Recipient address or ENS'
export const RECIPIENTS_HELPER_TEXT = 'Only these addresses can receive the tokens above.'
export const ADD_RECIPIENT_LABEL = 'Add recipient'
export const REMOVE_RECIPIENT_LABEL = 'Remove recipient'
export const DUPLICATE_RECIPIENT_ERROR = 'This recipient is already in the policy'
export const RECIPIENT_RESERVED_ERROR = 'This address cannot be a recipient'

export const TOKEN_ALLOWLIST_CALLOUT_TITLE = 'Transfers are restricted to this allowlist'

export const NATIVE_REVOKED_LABEL = 'No longer allowed'
export const NATIVE_REVOKED_HELPER_TEXT =
  'These recipients can currently receive the native coin. This policy removes that permission.'

// ─── Batched transactions ───────────────────────────────────────────────────

export const MULTISEND_EXPLAINER_TITLE = 'Every call in a batch is checked'
export const MULTISEND_EXPLAINER_TEXT =
  'Without this policy, the guard checks a batch as one call, so the transfers inside it skip your other policies. With it, each call in the batch faces the same policies it would on its own.'
export const MULTISEND_BATCHES_VIA_LABEL = 'Batches via'
export const NO_MULTISEND_ERROR = 'This network has no MultiSend deployment, so batches cannot be governed here.'

// ─── Safe management ────────────────────────────────────────────────────────

export const FUNCTIONS_LABEL = 'Allowed changes'
export const FUNCTIONS_HELPER_TEXT =
  "Each selected change keeps its own permission under the policy guard. Anything you leave out follows this Safe's fallback policy."
export const NO_FUNCTION_SELECTED_ERROR = 'Select at least one change'
export const GUARD_LOCK_TITLE = 'The policy guard may become unremovable'
export const GUARD_LOCK_TEXT =
  "You left out a guard change. If this Safe's fallback policy blocks what it doesn't cover, the policy guard can no longer be replaced."
export const GUARD_LOCK_CONFIRM_LABEL = 'I understand the guard may become unremovable'
export const ALLOWED_LABEL = 'Allowed'
export const FALLS_BACK_LABEL = 'Falls back'
export const NOTHING_LABEL = 'Nothing'
