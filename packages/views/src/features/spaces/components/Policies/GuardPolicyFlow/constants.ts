/** Shared by the three guard-enforced policy flows, so the flows cannot drift from one another. */

export const GUARD_POLICY_CREATE_STEP_TITLE = 'Create new policy'

export const GUARD_POLICY_REVIEW_STEP_TITLE = 'Confirm policy'

export const GUARD_POLICY_NEXT_LABEL = 'Next'

export const APPLIES_TO_LABEL = 'Applies to'

export const NO_POLICY_CONTRACTS_ERROR = "The policy engine isn't available for this Safe's network yet."

export const GUARD_READ_ERROR = "Couldn't read this Safe's module guard. Check your connection and try again."

export const UNKNOWN_GUARD_WARNING_TITLE = 'This replaces the Safe’s current guard'

export const UNKNOWN_GUARD_WARNING_TEXT =
  'This Safe already has a different transaction or module guard. Confirming this policy installs the policy guard in its place.'

export const TIME_LOCKED_TITLE = 'This change takes three steps'

export const TIME_LOCKED_TEXT =
  'This Safe already uses the policy guard. Owners approve this request, a security delay runs, then the change is applied. Follow each step on the Policies page.'

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
