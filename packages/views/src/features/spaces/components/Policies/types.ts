import type { Erc20TransferRecipientDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

/**
 * The resolved policy shape the UI consumes. It mirrors the CGW response, except that
 * `token` is joined from the tokens endpoint and `remaining` is derived.
 *
 * No type carries a name. Policy names are not stored on chain and are not in the CGW response;
 * they live in the space address book and the frontend resolves them.
 */

export type PolicyType =
  'spending-limit' | 'recovery' | 'proposer' | 'allowlist' | 'multisend' | 'safe-management' | 'policy-change'

/**
 * How the policy is enforced. A proposer grant is enforced by no contract, so it has no module
 * address and nothing to link to. This is on the wire so that components can branch on it instead
 * of checking the policy type.
 */
export type PolicyEnforcement =
  | { via: 'module'; moduleAddress: string }
  | { via: 'guard'; guardAddress: string; access?: PolicyAccess }
  | { via: 'offchain'; source: 'delegates' }

/**
 * The `(target, selector, operation)` the policy guard keys a policy by. Absent on a row that
 * groups several accesses, as the allowlist and Safe-management rows do.
 */
export type PolicyAccess = {
  target: string
  selector: string
  operation: 'CALL' | 'DELEGATECALL'
}

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

/** An executed change waiting out the guard's 24-hour delay. `create`: the allowlist is not enforced until then. */
// Placeholder: CGW has no field for this yet, so the shape follows the design until the API defines it.
export type AllowlistScheduledChange = {
  operation: 'create' | 'update'
  /** Unix SECONDS. */
  appliesAt: number
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

/** The multisend policy takes no payload: it only re-enters the engine for each call in a batch. */
export type MultiSendPolicyData = Record<string, never>

/** One management change the Safe still permits, named by its selector. */
export type SafeManagementChange = {
  selector: string
  /** From the known management functions; absent for a selector the client does not recognise. */
  label?: string
}

/**
 * The guard keys one policy per selector, but a reader thinks in terms of one rule per Safe, so
 * the row groups every permitted change together.
 */
export type SafeManagementPolicyData = {
  changes: SafeManagementChange[]
  /** How many management changes exist in all, so the row can say what is left out. */
  total: number
}

export type SpendingLimitPolicy = PolicyBase & { type: 'spending-limit'; data: SpendingLimitPolicyData }
export type MultiSendPolicy = PolicyBase & { type: 'multisend'; data: MultiSendPolicyData }
export type SafeManagementPolicy = PolicyBase & { type: 'safe-management'; data: SafeManagementPolicyData }
export type RecoveryPolicy = PolicyBase & { type: 'recovery'; data: RecoveryPolicyData }
export type ProposerPolicy = PolicyBase & { type: 'proposer'; data: ProposerPolicyData }
export type AllowlistPolicy = PolicyBase & {
  type: 'allowlist'
  data: AllowlistPolicyData
  /** Whether the guard also checks module transactions, such as spending limits. */
  spendingLimitsCovered: boolean
  scheduledChange?: AllowlistScheduledChange
}

export type ActivePolicy =
  SpendingLimitPolicy | RecoveryPolicy | ProposerPolicy | AllowlistPolicy | MultiSendPolicy | SafeManagementPolicy

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
}
export type PendingPolicy = PendingSpendingLimitPolicy | PendingRecoveryPolicy | PendingAllowlistPolicy

/** Still in the queue, as opposed to executed and waiting for the indexer. */
export type QueuedSpendingLimitPolicy = PendingSpendingLimitPolicy & { status: 'pending' }
export type QueuedAllowlistPolicy = PendingAllowlistPolicy & { status: 'pending' }
export type FailedAllowlistPolicy = PendingAllowlistPolicy & { status: 'failed' }

/** The queued Safe transaction a guard change is waiting on. */
export type GuardSetupTransaction = {
  safeTxHash: string
  nonce: number
  confirmationsSubmitted: number
  confirmationsRequired: number
  proposedAt: number
}

/** One `Configuration` of the SafePolicyGuard, exactly as hashed into its root. */
export type GuardConfiguration = {
  target: string
  selector: string
  operation: 0 | 1
  policy: string
  data: string
}

/** CGW's view of a delayed change; the app refines it by the clock between polls. */
export type DelayedGuardSetupStatus =
  | 'draft'
  | 'configuration-in-signing'
  | 'pending-application'
  | 'application-in-signing'
  | 'application-ready'
  | 'expired'

/**
 * How a guard change reaches the chain. Before the guard is enabled it is one transaction; once it is
 * enabled, the change is requested, waits out the guard's delay, and is then applied.
 */
export type GuardSetup =
  | { flow: 'immediate'; guard: string; transaction: GuardSetupTransaction }
  | {
      flow: 'delayed'
      status: DelayedGuardSetupStatus
      /** Null for a draft, which has not been requested on a guard yet. */
      guard: string | null
      root: string
      /** Null when CGW does not hold the configurations behind the root. */
      configurations: GuardConfiguration[] | null
      /** Unix seconds; null until the request executes. */
      readyAt: number | null
      expiresAt: number | null
      transaction: GuardSetupTransaction | null
    }

export type GuardSetupStepState = 'complete' | 'current' | 'upcoming' | 'failed'

export type GuardSetupStep = {
  id: 'request' | 'delay' | 'apply' | 'sign' | 'execute'
  title: string
  description: string
  state: GuardSetupStepState
}

/** What the viewer can do next: open the queued transaction, or propose the next one. */
export type GuardSetupAction = 'review-transaction' | 'apply' | 'request'

/** Where a guard change stands, as the app resolved it. */
export type GuardSetupProgress = {
  status: PolicyStatus
  steps: GuardSetupStep[]
  /** Where the change is, short enough for a table row. */
  summary: string
  /** Null while only time has to pass. */
  action: GuardSetupAction | null
}

/** The guard policies a change can be recognised as. */
export type GuardPolicyType = 'allowlist' | 'multisend' | 'safe-management'

/** A guard change that has not taken effect yet, as the table lists it. */
export type PendingGuardChange = PolicyBase & {
  type: 'policy-change'
  status: 'pending'
  setup: GuardSetup
  progress: GuardSetupProgress
  data: {
    /** Unset when the change holds several kinds of policy, or none the app recognises. */
    policyType?: GuardPolicyType
    /** Null when CGW does not hold the configurations behind the root. */
    ruleCount: number | null
  }
}

export type PolicyStatus =
  | 'active'
  | 'pending'
  | 'activating'
  | 'unenforced'
  | 'not-activated'
  | 'failed'
  | 'change-pending'
  | 'not-requested'
  | 'needs-signatures'
  | 'ready-to-execute'
  | 'security-delay'
  | 'ready-to-apply'
  | 'expired'

/** One table row: an active or a pending policy. */
export type Policy = (ActivePolicy & { status: 'active' }) | PendingPolicy | PendingGuardChange

/** The guard-enforced rows the generic guard drawer shows; the allowlist has its own. */
export type GuardPolicy = Extract<Policy, { type: 'multisend' | 'safe-management' }>

export const isGuardPolicy = (policy: Policy): policy is GuardPolicy =>
  policy.type === 'multisend' || policy.type === 'safe-management'

export const isPendingPolicy = (policy: Policy): policy is PendingPolicy =>
  policy.type !== 'policy-change' &&
  (policy.status === 'pending' || policy.status === 'activating' || policy.status === 'failed')

export const isGuardChange = (policy: Policy): policy is PendingGuardChange => policy.type === 'policy-change'

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
  if (isGuardChange(policy)) return policy.progress.status
  if (isPendingPolicy(policy)) return policy.status
  if (isAllowlistPolicy(policy) && policy.scheduledChange) return 'change-pending'
  if (policy.enabled) return 'active'

  // A proposer grant has no module to switch on, so one that is not in force was never activated.
  return isProposerPolicy(policy) ? 'not-activated' : 'unenforced'
}
