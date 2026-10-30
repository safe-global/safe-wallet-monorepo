import type { Erc20TransferRecipientDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

/**
 * The resolved policy shape the UI consumes. It mirrors the CGW response, except that
 * `token` is joined from the tokens endpoint and `remaining` is derived.
 *
 * No type carries a name. Policy names are not stored on chain and are not in the CGW response;
 * they live in the space address book and the frontend resolves them.
 */

export type PolicyType = 'spending-limit' | 'recovery' | 'proposer' | 'allowlist'

/**
 * How the policy is enforced. A proposer grant is enforced by no contract, so it has no module
 * address and nothing to link to. This is on the wire so that components can branch on it instead
 * of checking the policy type.
 */
export type PolicyEnforcement =
  | { via: 'module'; moduleAddress: string }
  | { via: 'guard'; guardAddress: string }
  | { via: 'offchain'; source: 'delegates' }

/** CGW has no Safe ID. A Safe is identified by its chain and its address. */
export type PolicySafe = {
  address: string
  chainId: string
}

export type PolicyTokenInfo = {
  address: string
  symbol: string
  decimals: number
  logoUri: string | null
}

/** How a queued edit changes an allowance the policy already holds. Unset on active rows and on a brand-new policy. */
export type PendingAllowanceChange = 'added' | 'changed' | 'removed'

export type PolicyAllowance = {
  /** From the CGW response's `tokenMetadata`; the address alone when CGW could not resolve it. */
  token: PolicyTokenInfo
  /** Base units. */
  amount: string
  /** Base units, spent in the current period. */
  spent: string
  /** Base units, `amount - spent`. Derived — CGW does not return it. */
  remaining: string
  /** Minutes, matching the allowance module's own unit. 0 means the allowance does not repeat. */
  resetPeriodMinutes: number
  /** Unix MINUTES; null when one-time. */
  resetsAtMinute: number | null
  /** Unix SECONDS the allowance was set or re-set. Queued set-allowance changes omit it; queued resets and removals keep the active one's. */
  createdAt?: number
  change?: PendingAllowanceChange
}

export type PolicySpender = {
  spender: string
  /** False when the spender was removed as a delegate and cannot spend, though the allowances still exist. */
  isActive?: boolean
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

export type ProposerGrant = {
  /** The grant outlives its granter: this signer may no longer be an owner of the Safe. */
  delegator: string
  label: string
}

export type Proposer = {
  proposer: string
  delegatedBy: ProposerGrant[]
}

/** CGW sends every proposer of a Safe in one policy; `mapActivePolicies` splits it into one per proposer. */
export type ProposerPolicyData = {
  proposers: Proposer[]
}

export type AllowlistRecipient = Erc20TransferRecipientDto

/** CGW returns one `erc20-transfer` policy per token; the table shows one allowlist per Safe holding them all. */
export type AllowlistEntry = {
  token: PolicyTokenInfo
  recipients: AllowlistRecipient[]
}

export type AllowlistPolicyData = {
  entries: AllowlistEntry[]
}

/** An executed change waiting out the guard's delay. `create`: the allowlist is not enforced until then. */
// Placeholder: CGW has no field for this yet, so the shape follows the design until the API defines it.
export type AllowlistScheduledChange = {
  operation: 'create' | 'update' | 'remove'
  /** Unix SECONDS `applyConfiguration` is valid from (CGW `readyAt`). */
  appliesAt: number
  /** Unix SECONDS the apply window closes (CGW `expiresAt`); unset when unknown. */
  expiresAt?: number
  /** Unix SECONDS the wallet first stored the change (CGW `createdAt`); unset for a root requested elsewhere. */
  requestedAt?: number
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
}

export type SpendingLimitPolicy = PolicyBase & { type: 'spending-limit'; data: SpendingLimitPolicyData }
export type RecoveryPolicy = PolicyBase & { type: 'recovery'; data: RecoveryPolicyData }
export type ProposerPolicy = PolicyBase & { type: 'proposer'; data: ProposerPolicyData }
export type AllowlistPolicy = PolicyBase & {
  type: 'allowlist'
  data: AllowlistPolicyData
  /** Whether the guard also checks module transactions, such as spending limits. */
  spendingLimitsCovered: boolean
  scheduledChange?: AllowlistScheduledChange
  /** An applied removal deleted every rule; the guard is still on and only lets itself be taken off. */
  awaitingGuardRemoval?: boolean
}

export type ActivePolicy = SpendingLimitPolicy | RecoveryPolicy | ProposerPolicy | AllowlistPolicy

/** What a queued Safe transaction would do to a policy once it executes. */
export type PendingPolicyOperation = 'create' | 'update' | 'remove'

type PendingPolicyBase = PolicyBase & {
  /** `activating`: executed onchain, not yet reported by the indexer. */
  status: 'pending' | 'activating'
  /** A queued removal and a queued creation need different wording, so the two are distinguished. */
  operation: PendingPolicyOperation
  safeTxHash: string
  nonce: number
  confirmationsSubmitted: number
  confirmationsRequired: number
  proposedAt: number
}

/** A proposer grant is granted off chain and takes effect at once, so it is never pending. */
export type PendingSpendingLimitPolicy = PendingPolicyBase & { type: 'spending-limit'; data: SpendingLimitPolicyData }
export type PendingRecoveryPolicy = PendingPolicyBase & { type: 'recovery'; data: RecoveryPolicyData }
// Placeholder: `failed` (executed but reverted, nothing changed) follows the design; CGW's pending API has no such state yet.
export type PendingAllowlistPolicy = Omit<PendingPolicyBase, 'status'> & {
  status: PendingPolicyBase['status'] | 'failed'
  type: 'allowlist'
  data: AllowlistPolicyData
  // Placeholder: a draft CGW PR adds this timestamp to pending transactions; rename to match it once merged.
  /** Unix SECONDS after which the queued transaction can no longer be signed. */
  expiresAt?: number
  /** A first setup (`configureImmediately`): its rules apply as it executes, without the guard's delay. */
  appliesOnExecution?: boolean
}
export type PendingPolicy = PendingSpendingLimitPolicy | PendingRecoveryPolicy | PendingAllowlistPolicy

/** Still in the queue, as opposed to executed and waiting for the indexer. */
export type QueuedSpendingLimitPolicy = PendingSpendingLimitPolicy & { status: 'pending' }
export type QueuedAllowlistPolicy = PendingAllowlistPolicy & { status: 'pending' }
export type FailedAllowlistPolicy = PendingAllowlistPolicy & { status: 'failed' }

export type PolicyStatus =
  'active' | 'pending' | 'activating' | 'unenforced' | 'not-activated' | 'failed' | 'change-pending' | 'expired'

/** One table row: an active or a pending policy. */
export type Policy = (ActivePolicy & { status: 'active' }) | PendingPolicy

export const isPendingPolicy = (policy: Policy): policy is PendingPolicy =>
  policy.status === 'pending' || policy.status === 'activating' || policy.status === 'failed'

export const isSpendingLimitPolicy = (policy: Policy): policy is Extract<Policy, { type: 'spending-limit' }> =>
  policy.type === 'spending-limit'

export const isProposerPolicy = (policy: Policy): policy is ProposerPolicy & { status: 'active' } =>
  policy.type === 'proposer'

export const isAllowlistPolicy = (policy: Policy): policy is Extract<Policy, { type: 'allowlist' }> =>
  policy.type === 'allowlist'

export const isActiveAllowlistPolicy = (policy: Policy): policy is AllowlistPolicy & { status: 'active' } =>
  isAllowlistPolicy(policy) && policy.status === 'active'

export const hasRecoveryData = (policy: Policy): policy is Extract<Policy, { type: 'recovery' }> =>
  policy.type === 'recovery'

/**
 * The status a row renders. A module that is present but not enabled is shown as unenforced.
 * Calling it active would tell the user the Safe is protected when it is not.
 */
export const getPolicyStatus = (policy: Policy): PolicyStatus => {
  if (isPendingPolicy(policy)) return policy.status
  if (isAllowlistPolicy(policy) && (policy.scheduledChange || policy.awaitingGuardRemoval)) return 'change-pending'
  if (policy.enabled) return 'active'

  // A proposer grant has no module to switch on, so one that is not in force was never activated.
  return isProposerPolicy(policy) ? 'not-activated' : 'unenforced'
}
