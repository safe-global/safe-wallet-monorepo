/**
 * Domain vocabulary + wire types for the Spaces policy engine CGW endpoints.
 * The enum string values are the wire-format contract with CGW — do not rename
 * them without a coordinated backend change.
 */

/** Which policy a configured entry is. Discriminator on active policies. */
export enum PolicyType {
  SpendingLimit = 'spending-limit',
  Recovery = 'recovery',
  TokenWithdraw = 'ERC20TransferPolicy',
  Cosigner = 'cosigner',
  /** The SafePolicyGuard's unrestricted catch-all entry. Carries no data. */
  Allow = 'AllowPolicy',
}

/**
 * A plain ERC20 token descriptor (display metadata).
 */
export type TokenInfo = {
  address: string
  symbol: string
  decimals: number
  logoUri?: string | null
}

/**
 * The two on-chain contract addresses for a policy that sits in one guard slot:
 *  - policyContract:  the policy instance itself (e.g. an ERC20TransferPolicy)
 *  - safePolicyGuard: the SafePolicyGuard installed on the Safe that invokes it
 */
export type PolicyContracts = {
  policyContract: string
  safePolicyGuard: string
}

/**
 * Which of the Safe's two guard slots a guard-enforced policy occupies. At least
 * one is set; both set = the "module guard + transaction guard" configuration.
 *  - transactionGuard: checks ALL Safe transactions (`execTransaction`)
 *  - moduleGuard:      checks ALL module executions (`execTransactionFromModule`)
 */
export type GuardSlots = {
  transactionGuard?: PolicyContracts
  moduleGuard?: PolicyContracts
}

/**
 * How a policy is enforced on the Safe:
 *  - via 'module' — a Safe module is enabled (e.g. the AllowanceModule for a
 *    spending limit). No guard involved.
 *  - via 'guard'  — a SafePolicyGuard occupies the tx-guard and/or module-guard
 *    slot (e.g. an ERC20TransferPolicy for a token withdraw allowlist).
 */
export type Enforcement = { via: 'module'; moduleAddress: string } | { via: 'guard'; guards: GuardSlots }

/** Shared envelope every active (configured) policy carries. */
export type PolicyBase = {
  id: string
  type: PolicyType
  enforcement: Enforcement
  enabled: boolean
}

/* ---- 1. Spending limit ---- */
// TODO: Map to actual allowance module fields
export type SpendingLimitPolicyData = {
  beneficiary: string
  limits: Array<{
    token: TokenInfo
    amount: string
    spent: string
    nonce: string
  }>
}
export type SpendingLimitPolicy = PolicyBase & { type: PolicyType.SpendingLimit; data: SpendingLimitPolicyData }

/* ---- 2. Recovery ---- */
export type RecoveryPolicyData = {
  recoverers: string[]
  cooldownSec: string // seconds
  expirySec: string
}
export type RecoveryPolicy = PolicyBase & { type: PolicyType.Recovery; data: RecoveryPolicyData }

/* ---- 3. Token withdraw allowlist ---- */
export type TokenWithdrawPolicyData = {
  /** One allowlist entry per token → the destination addresses ERC20 transfers may target. */
  allowlist: Array<{
    token: TokenInfo
    recipients: Array<{ address: string; name?: string | null }>
  }>
}
export type TokenWithdrawPolicy = PolicyBase & { type: PolicyType.TokenWithdraw; data: TokenWithdrawPolicyData }

/* ---- 4. Cosigner (amount-threshold per token) ---- */
export type CosignerPolicyData = {
  rules: Array<{
    token: TokenInfo
    cosigner: { address: string; name?: string | null }
    thresholdAmount: string
  }>
}
export type CosignerPolicy = PolicyBase & { type: PolicyType.Cosigner; data: CosignerPolicyData }

/* ---- 5. Allow (catch-all) ---- */
/** The catch-all guard entry. CGW returns an empty `data` object for it. */
export type AllowPolicyData = Record<string, never>
export type AllowPolicy = PolicyBase & { type: PolicyType.Allow; data: AllowPolicyData }

/** Discriminated union of all active-policy shapes (returned by getActivePolicies). */
export type ActivePolicy = SpendingLimitPolicy | RecoveryPolicy | TokenWithdrawPolicy | CosignerPolicy | AllowPolicy

/**
 * A policy change that has been REQUESTED on-chain (`requestConfiguration`) but
 * not yet APPLIED — it sits out the SafePolicyGuard's DELAY before
 * `applyConfiguration` becomes valid. Returned by getPendingPolicies.
 *
 *  - configureRoot: keccak256(abi.encode(Configuration[])) — the requested root.
 *  - requestedAt / readyAt: unix seconds; readyAt = requestedAt + DELAY.
 *  - isReady: whether the delay has elapsed (readyAt <= now) so it can be applied.
 *  - policy: the decoded change, when CGW can resolve it from the root. It is
 *    `null` for roots CGW cannot decode (only the request metadata is known),
 *    so consumers must render from the metadata alone in that case.
 *
 * Note the wire format carries NO `Configuration[]`; `applyConfiguration` needs
 * that array, so it has to come from the requester's local snapshot, matched on
 * `configureRoot`.
 */
export type PendingPolicy = {
  configureRoot: string
  requestedAt: number
  readyAt: number
  isReady: boolean
  policy: ActivePolicy | null
}

/**
 * A catalogue entry for a policy type the Safe can configure (returned by
 * getPolicies). `enforcement` describes how creating this policy is wired on the
 * Safe — module-enabled (spending limit, recovery) or guard-based (token
 * withdraw, cosigner) — and carries the contract address(es) the builder needs.
 */
export type AvailablePolicy = {
  type: PolicyType
  title: string
  description: string
  available: boolean // false - Disable related Policy Card or hide it
  configuredCount: number
  /**
   * `null` when CGW has no wiring to report for this policy type on this chain
   * (e.g. no policy-engine deployment). Builders must then source the contract
   * addresses elsewhere — see the token-withdraw wizard, which falls back to the
   * Safe's active policy of the same type.
   */
  enforcement: Enforcement | null
}

/* ---- request / response envelopes (space-scoped, credentialed routes) ---- */
export type PolicyQueryArg = { spaceId: string; chainId: string; safeAddress: string }
export type GetPoliciesResponse = { items: AvailablePolicy[] }
export type GetActivePoliciesResponse = { items: ActivePolicy[] }
export type GetPendingPoliciesResponse = { items: PendingPolicy[] }

/**
 * One `Configuration` entry as the WRITE endpoint expects it.
 *
 * `operation` is numeric here (0 = CALL, 1 = DELEGATECALL), mirroring the on-chain
 * encoding — the read endpoints serialize it as `"CALL"` / `"DELEGATECALL"`, so the
 * two forms are not interchangeable. `data` is the raw policy payload (`0x` when the
 * policy takes none) and a zero `policy` address removes that access's policy.
 */
export type PolicyConfigurationInput = {
  target: string
  selector: string
  operation: 0 | 1
  policy: string
  data: string
}

/**
 * Stores the `Configuration[]` behind a delayed request so CGW can explain what a
 * pending root changes — `requestConfiguration` publishes only the root, and the
 * wallet is the only party holding the payload at request time.
 *
 * Idempotent per `(chainId, safeAddress, root)`, so retries are free.
 */
export type CreatePolicyRequestArg = PolicyQueryArg & {
  /** keccak256(abi.encode(configurations)) — must be the value requested on-chain. */
  root: string
  configurations: PolicyConfigurationInput[]
}
export type CreatePolicyRequestResponse = { configureRoot: string }
