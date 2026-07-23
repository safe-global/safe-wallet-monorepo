/**
 * Domain vocabulary + wire types for the Spaces policy engine CGW endpoints.
 * The enum string values are the wire-format contract with CGW — do not rename
 * them without a coordinated backend change.
 */

/** Which policy a configured entry is. Discriminator on active policies. */
export enum PolicyType {
  SpendingLimit = 'spending-limit',
  Recovery = 'recovery',
  TokenWithdraw = 'token-withdraw',
  Cosigner = 'cosigner',
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

/** Discriminated union of all active-policy shapes (returned by getActivePolicies). */
export type ActivePolicy = SpendingLimitPolicy | RecoveryPolicy | TokenWithdrawPolicy | CosignerPolicy

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
  enforcement: Enforcement
}

/* ---- request / response envelopes (space-scoped, credentialed routes) ---- */
export type PolicyQueryArg = { spaceId: string; chainId: string; safeAddress: string }
export type GetPoliciesResponse = { items: AvailablePolicy[] }
export type GetActivePoliciesResponse = { items: ActivePolicy[] }
