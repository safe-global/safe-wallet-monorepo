/**
 * Frontend copy of the policy types CGW will return (WA-3218). Kept close to the wire shape so
 * that WA-3451 can replace the fixtures with the real response without changing these types.
 *
 * No type carries a name. Policy names are not stored on chain and are not in the CGW response;
 * they live in the space address book and the frontend resolves them.
 */

export type PolicyType = 'spending-limit' | 'recovery' | 'proposer'

/**
 * How the policy is enforced. A proposer grant is enforced by no contract, so it has no module
 * address and nothing to link to. This is on the wire so that components can branch on it instead
 * of checking the policy type.
 */
export type PolicyEnforcement = { via: 'module'; moduleAddress: string } | { via: 'offchain'; source: 'delegates' }

/** CGW has no Safe ID. A Safe is identified by its chain and its address. */
export type PolicySafe = {
  address: string
  chainId: string
}

export type PolicyTokenInfo = {
  address: string
  symbol: string
  decimals: number
  logoUri?: string | null
}

export type PolicyAllowance = {
  token: PolicyTokenInfo
  /** Base units. */
  amount: string
  /** Base units, spent in the current period. */
  spent: string
  /** Base units, `amount - spent`. */
  remaining: string
  /** 0 means the allowance does not repeat. The allowance module stores this per token. */
  resetPeriodSeconds: number
  /** Unix seconds; null when one-time. */
  resetsAt: number | null
}

export type PolicySpender = {
  spender: string
  allowances: PolicyAllowance[]
}

/** One policy per Safe holds every spender for that Safe. There is no policy per spender. */
export type SpendingLimitPolicyData = {
  spenders: PolicySpender[]
}

export type RecoveryPolicyData = {
  recoverers: string[]
  reviewWindowSeconds: number
  /** 0 = never expires. */
  proposalExpirySeconds: number
  pendingRecovery: {
    proposedAt: number
    executableAt: number
    expiresAt: number | null
    isExecutable: boolean
    proposedBy: string
  } | null
}

export type ProposerPolicyData = {
  proposer: string
  /** The grant outlives its granter: this signer may no longer be an owner of the Safe. */
  grantedBy: string
  grantedAt: number
}

type PolicyBase = {
  /** Stable across requests. Table rows and the open detail panel are keyed on it. */
  id: string
  safe: PolicySafe
  enforcement: PolicyEnforcement
  /**
   * For module-enforced policies, whether the module is enabled on the Safe. A configured policy
   * whose module is disabled enforces nothing, and the table says so rather than calling it active.
   */
  enabled: boolean
  createdBy: string
  /** Unix seconds. */
  createdAt: number
}

export type SpendingLimitPolicy = PolicyBase & { type: 'spending-limit'; data: SpendingLimitPolicyData }
export type RecoveryPolicy = PolicyBase & { type: 'recovery'; data: RecoveryPolicyData }
export type ProposerPolicy = PolicyBase & { type: 'proposer'; data: ProposerPolicyData }

export type ActivePolicy = SpendingLimitPolicy | RecoveryPolicy | ProposerPolicy

/** What a queued Safe transaction would do to a policy once it executes. */
export type PendingPolicyOperation = 'create' | 'update' | 'remove'

type PendingPolicyBase = PolicyBase & {
  status: 'pending'
  /** A queued removal and a queued creation need different wording, so the two are distinguished. */
  operation: PendingPolicyOperation
  safeTxHash: string
  nonce: number
  confirmationsSubmitted: number
  confirmationsRequired: number
  /** Signers who have not yet confirmed. */
  missingSigners: string[]
  proposedAt: number
  /** The active policy this replaces, so a queued edit is not rendered as a second policy. */
  supersedesId: string | null
}

/** A proposer grant is granted off chain and takes effect at once, so it is never pending. */
export type PendingSpendingLimitPolicy = PendingPolicyBase & { type: 'spending-limit'; data: SpendingLimitPolicyData }
export type PendingRecoveryPolicy = PendingPolicyBase & { type: 'recovery'; data: RecoveryPolicyData }
export type PendingPolicy = PendingSpendingLimitPolicy | PendingRecoveryPolicy

export type PolicyStatus = 'active' | 'pending' | 'unenforced'

/** One table row: an active or a pending policy. */
export type Policy = (ActivePolicy & { status: 'active' }) | PendingPolicy

export const isPendingPolicy = (policy: Policy): policy is PendingPolicy => policy.status === 'pending'

/** Active and pending spending limits carry the same data, so both render the same limits. */
export const hasSpendingLimitData = (policy: Policy): policy is Extract<Policy, { type: 'spending-limit' }> =>
  policy.type === 'spending-limit'

export const hasRecoveryData = (policy: Policy): policy is Extract<Policy, { type: 'recovery' }> =>
  policy.type === 'recovery'

export const isProposerPolicy = (policy: Policy): policy is ProposerPolicy & { status: 'active' } =>
  policy.type === 'proposer'

/**
 * The status a row renders. A module that is present but not enabled is shown as unenforced.
 * Calling it active would tell the user the Safe is protected when it is not.
 */
export const getPolicyStatus = (policy: Policy): PolicyStatus => {
  if (isPendingPolicy(policy)) return 'pending'
  return policy.enabled ? 'active' : 'unenforced'
}
