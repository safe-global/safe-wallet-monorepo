/**
 * Domain vocabulary + wire types for the Spaces policy engine CGW endpoints.
 * The enum string values are the wire-format contract with CGW — do not rename
 * them without a coordinated backend change.
 */

/**
 * Which policy a configured entry is. Discriminator on active policies.
 *
 * The values are CGW's wire vocabulary, not the policy contract names — `GET
 * /v1/spaces/:id/policies/active` both filters on them (`types`) and discriminates with
 * them. MultiSend has no wire value yet: CGW does not report it, so it is classified
 * client-side from the policy contract address.
 */
export enum PolicyType {
  SpendingLimit = 'spending-limit',
  Recovery = 'recovery',
  Proposer = 'proposer',
  TokenWithdraw = 'erc20-transfer',
  Cosigner = 'cosigner',
  /** The SafePolicyGuard's unrestricted catch-all entry. Carries no data. */
  Allow = 'allow',
  /** Governs plain value transfers, which carry no function selector. */
  NativeTransfer = 'native-transfer',
  /** Blocks anything no other policy covers. */
  Deny = 'deny',
  /** Applies the Safe's other policies to each call inside a MultiSend batch. */
  MultiSend = 'multisend',
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
 * The (target, selector, operation) triple a guard-enforced policy is bound to — the key the
 * guard stores it under. `operation` is the wire's string form, unlike the numeric one the
 * write path uses.
 */
export type PolicyAccess = {
  target: string
  selector: string
  operation: 'CALL' | 'DELEGATECALL'
}

/**
 * How a policy is enforced on the Safe:
 *  - via 'module'   — a Safe module is enabled (e.g. the AllowanceModule for a spending limit)
 *  - via 'guard'    — a SafePolicyGuard occupies the tx-guard and/or module-guard slot
 *  - via 'offchain' — nothing on-chain enforces it; the gateway does (e.g. a proposer grant)
 */
export type Enforcement =
  | { via: 'module'; moduleAddress: string }
  | {
      via: 'guard'
      guards: GuardSlots
      /**
       * Always present on an active policy — the read endpoint requires it. Optional on the
       * type because the same shape describes a catalogue entry and a locally recorded
       * request, neither of which is bound to an access yet.
       */
      access?: PolicyAccess
    }
  | { via: 'offchain'; source: string }

/** The Safe a policy applies to. Every active policy carries one: the read is space-wide. */
export type SafeRef = {
  chainId: string
  address: string
}

/**
 * Fields every active policy carries.
 *
 * Deliberately no `id`: the read endpoint does not return one, so a policy cannot be
 * addressed by its access key. Anything needing a stable identity derives one — see
 * `activePolicyKey`.
 */
export type PolicyBase = {
  type: PolicyType
  enforcement: Enforcement
  enabled: boolean
  safe: SafeRef
}

/* ---- 1. Spending limit (AllowanceModule state) ---- */
export type SpendingLimitAllowance = {
  tokenAddress: string
  tokenMetadata: TokenInfo | null
  amount: string
  spent: string
  resetPeriodMinutes: number
  resetsAtMinute: number
  resetBoundaryIsExact: boolean
  isDelegateActive: boolean
  createdAt: number
  updatedAt: number
}
export type SpendingLimitSpender = {
  spender: string
  isActive: boolean
  allowances: SpendingLimitAllowance[]
}
export type SpendingLimitPolicyData = {
  module: string
  spenders: SpendingLimitSpender[]
}
export type SpendingLimitPolicy = PolicyBase & { type: PolicyType.SpendingLimit; data: SpendingLimitPolicyData }

/* ---- 2. Recovery ---- */
export type RecoveryPolicyData = {
  recoverers: string[]
  /** Delay-modifier timings. CGW defines no recovery payload, so these stay optional. */
  cooldownSec?: string
  expirySec?: string
}
export type RecoveryPolicy = PolicyBase & { type: PolicyType.Recovery; data: RecoveryPolicyData }

/* ---- 3. Proposer (off-chain grant) ---- */
export type ProposerGrant = {
  delegator: string
  label: string
}
export type Proposer = {
  proposer: string
  delegatedBy: ProposerGrant[]
}
export type ProposerPolicyData = {
  proposers: Proposer[]
}
export type ProposerPolicy = PolicyBase & { type: PolicyType.Proposer; data: ProposerPolicyData }

/* ---- 4. Token withdraw allowlist (ERC20TransferPolicy) ---- */
export type TokenWithdrawRecipient = {
  account: string
  permission: string
}
export type TokenWithdrawAllowlistEntry = {
  tokenAddress: string
  recipients: TokenWithdrawRecipient[]
}
export type TokenWithdrawPolicyData = {
  allowlist: TokenWithdrawAllowlistEntry[]
}
export type TokenWithdrawPolicy = PolicyBase & { type: PolicyType.TokenWithdraw; data: TokenWithdrawPolicyData }

/* ---- 5. Cosigner ---- */
export type CosignerPolicyData = {
  cosignerAddress: string
}
export type CosignerPolicy = PolicyBase & { type: PolicyType.Cosigner; data: CosignerPolicyData }

/* ---- 6. Stateless policies ---- */
/** Allow, Deny, NativeTransfer and MultiSend take no payload: the wire sends `{}`. */
export type StatelessPolicyData = Record<string, never>
export type StatelessPolicy = PolicyBase & {
  type: PolicyType.Allow | PolicyType.Deny | PolicyType.NativeTransfer | PolicyType.MultiSend
  data: StatelessPolicyData
}

/** Discriminated union of all active-policy shapes (returned by getActivePolicies). */
export type ActivePolicy =
  SpendingLimitPolicy | RecoveryPolicy | ProposerPolicy | TokenWithdrawPolicy | CosignerPolicy | StatelessPolicy

/**
 * One binding of a requested change, as CGW reports it on a pending item.
 *
 * Maps back to the on-chain `Configuration` struct mechanically — `operation`
 * `'CALL' | 'DELEGATECALL'` → `0 | 1`, `policyContract ?? zeroAddress` → `policy` —
 * and `data` is the payload exactly as hashed into the root (`0x` when the policy
 * takes none). Rebuilding must preserve the array order: order fixes the hash.
 */
export type PolicyInfo = {
  id: string
  target: string
  selector: string
  operation: 'CALL' | 'DELEGATECALL'
  policyContract: string | null
  /**
   * Absent on a CGW that doesn't serve the payload yet. Without it the bindings
   * describe the request but cannot rebuild it, so consumers must check before
   * hashing — a missing `data` is not an encodable empty payload.
   */
  data?: string | null
}

/**
 * A policy change that has been REQUESTED on-chain (`requestConfiguration`) but
 * not yet APPLIED — it sits out the SafePolicyGuard's DELAY before
 * `applyConfiguration` becomes valid. Returned by getPendingPolicies.
 *
 *  - configureRoot: keccak256(abi.encode(Configuration[])) — the requested root.
 *  - isRootConfigured: whether `requestConfiguration(root)` has actually executed. While the
 *    request transaction is still queued in the Safe the root isn't on the guard yet, so
 *    there is no delay to wait out (`readyAt` is null) and nothing to apply.
 *  - requestedAt / readyAt: unix seconds; readyAt = requestedAt + DELAY, null until the
 *    request is on-chain.
 *  - isReady: whether the delay has elapsed (readyAt <= now) so it can be applied.
 *  - safePolicyGuard: the guard holding the request — the `to` of apply and cancel.
 *  - policies: the bindings of the requested change, in submitted order, or `null`
 *    when CGW has no stored payload for the root (requested before the store
 *    existed, or outside the wallet). Applying is impossible in that case; the
 *    request can still be cancelled, which needs only the root.
 *
 * `safePolicyGuard` and `policies` arrive with the pending-details work; both are
 * optional so the wallet keeps working against a CGW that predates it, where the
 * requester's own local snapshot is the only source of the configurations.
 */
export type PendingPolicy = {
  configureRoot: string
  /** Absent on a CGW that predates the flag, where every row is already on-chain. */
  isRootConfigured?: boolean
  requestedAt: number
  readyAt: number | null
  isReady: boolean
  safePolicyGuard?: string
  policies?: PolicyInfo[] | null
  /** Pre-details CGW: the decoded change, or `null`. Superseded by `policies`. */
  policy?: ActivePolicy | null
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
  /**
   * Whether this policy occupies the guard's catch-all access. Only one fallback
   * applies at a time, so these are grouped apart from the specific policies.
   */
  isFallback: boolean
  configuredCount?: number
  /**
   * `null` when CGW has no wiring to report for this policy type on this chain
   * (e.g. no policy-engine deployment). Builders must then source the contract
   * addresses elsewhere — see the token-withdraw wizard, which falls back to the
   * Safe's active policy of the same type.
   */
  enforcement: Enforcement | null
}

/* ---- request / response envelopes (space-scoped, credentialed routes) ---- */
export type PolicyQueryArg = {
  spaceId: string
  chainId: string
  safeAddress: string
  /** Narrows the mandatory `types` filter. Defaults to every type CGW knows. */
  types?: PolicyType[]
}
export type GetPoliciesResponse = { items: AvailablePolicy[] }
/** The read returns a bare array — there is no `items` envelope. */
export type GetActivePoliciesResponse = ActivePolicy[]
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

/**
 * A stable key for an active policy.
 *
 * A Safe can hold many policies of one type — nine AllowPolicy bindings, one per governed
 * Safe-management selector — so type alone does not identify a row. For guard-enforced
 * policies the access does; the others fall back to their enforcing contract, with the index
 * to separate what is still identical.
 */
export const activePolicyKey = (policy: ActivePolicy, index: number): string => {
  const base = `${policy.safe.chainId}:${policy.safe.address}:${policy.type}`

  if (policy.enforcement.via === 'guard' && policy.enforcement.access) {
    const { target, selector, operation } = policy.enforcement.access
    return `${base}:${target}:${selector}:${operation}`
  }

  if (policy.enforcement.via === 'guard') {
    return `${base}:${policy.enforcement.guards.transactionGuard?.policyContract ?? ''}:${index}`
  }

  const contract = policy.enforcement.via === 'module' ? policy.enforcement.moduleAddress : policy.enforcement.source

  return `${base}:${contract}:${index}`
}

/** The access a policy occupies, when it is guard-enforced. */
export const accessOf = (policy: ActivePolicy): PolicyAccess | undefined =>
  policy.enforcement.via === 'guard' ? policy.enforcement.access : undefined
