import { AbiCoder, Interface, keccak256 } from 'ethers'
import type { MetaTransactionData } from '@safe-global/types-kit'
import type { Address } from 'viem'

export const SAFE_SET_GUARD_ABI = ['function setGuard(address guard)'] as const

/** The `Configuration` tuple, shared by every SafePolicyGuard config method. */
const CONFIGURATION_TUPLE = 'tuple(address target, bytes4 selector, uint8 operation, address policy, bytes data)'

export const CONFIGURE_IMMEDIATELY_ABI = [
  `function configureImmediately(${CONFIGURATION_TUPLE}[] configurations)`,
] as const

/**
 * Two-step config for a Safe that ALREADY has the policy guard active:
 * `requestConfiguration(root)` starts an on-chain DELAY, then (once elapsed)
 * `applyConfiguration(configurations)` commits it. `configureImmediately` can't
 * be used here — it reverts in the guard's `checkTransaction` once the guard is
 * live. Source: safe-research/policy-engine SafePolicyGuard.sol.
 */
export const REQUEST_CONFIGURATION_ABI = ['function requestConfiguration(bytes32 configureRoot)'] as const
export const APPLY_CONFIGURATION_ABI = [`function applyConfiguration(${CONFIGURATION_TUPLE}[] configurations)`] as const

export const OPERATION_CALL = 0

/**
 * The SafePolicyGuard configuration DELAY, in seconds. Used to estimate when a
 * requested change becomes applyable (readyAt = requestedAt + DELAY) for the
 * Pending UI. The guard exposes the real value via its `DELAY()` immutable; this
 * default (24h) is a display estimate until we read it on-chain / from CGW.
 */
export const POLICY_GUARD_DELAY_SEC = 5

const safeIface = new Interface(SAFE_SET_GUARD_ABI)
const guardIface = new Interface(CONFIGURE_IMMEDIATELY_ABI)
const requestIface = new Interface(REQUEST_CONFIGURATION_ABI)
const applyIface = new Interface(APPLY_CONFIGURATION_ABI)

/** One `Configuration` entry for `configureImmediately`. */
export type PolicyConfiguration = {
  target: string
  selector: string
  operation: number
  policy: string
  data: string
}

/**
 * Builds the `setGuard(policyEngine)` tx — a call to the Safe itself.
 * Reusable by every guard-enforced policy. The caller decides whether it's
 * needed (i.e. the guard isn't already installed) via `usePolicyGuard`.
 */
export const buildSetGuardTx = (safeAddress: Address, policyEngine: Address): MetaTransactionData => ({
  to: safeAddress,
  value: '0',
  data: safeIface.encodeFunctionData('setGuard', [policyEngine]),
})

/** Configuration[] as the positional tuples ethers expects for encoding. */
const toTuples = (configurations: PolicyConfiguration[]) =>
  configurations.map((c) => [c.target, c.selector, c.operation, c.policy, c.data])

/**
 * Builds the `configureImmediately(Configuration[])` tx against the guard.
 * Each policy builder supplies its own `Configuration[]`; this shared encoder
 * turns them into the guard call. Only valid before the guard is active.
 */
export const encodeConfiguration = (
  policyEngine: Address,
  configurations: PolicyConfiguration[],
): MetaTransactionData => ({
  to: policyEngine,
  value: '0',
  data: guardIface.encodeFunctionData('configureImmediately', [toTuples(configurations)]),
})

/**
 * The on-chain `configureRoot` — `keccak256(abi.encode(Configuration[]))`.
 * The Safe first `requestConfiguration(root)`s this, then after the guard's
 * DELAY `applyConfiguration(configurations)`s the same array (whose re-hash must
 * match). Must byte-match Solidity `abi.encode`, hence the exact tuple type.
 */
export const computeConfigureRoot = (configurations: PolicyConfiguration[]): string =>
  keccak256(AbiCoder.defaultAbiCoder().encode([`${CONFIGURATION_TUPLE}[]`], [toTuples(configurations)]))

/**
 * Builds the `requestConfiguration(root)` tx against the guard — step 1 of the
 * delayed path for a Safe whose guard is already active.
 */
export const encodeRequestConfiguration = (
  policyEngine: Address,
  configurations: PolicyConfiguration[],
): MetaTransactionData => ({
  to: policyEngine,
  value: '0',
  data: requestIface.encodeFunctionData('requestConfiguration', [computeConfigureRoot(configurations)]),
})

/**
 * Builds the `applyConfiguration(Configuration[])` tx against the guard — step 2,
 * valid only once the DELAY from the matching `requestConfiguration` has elapsed.
 */
export const encodeApplyConfiguration = (
  policyEngine: Address,
  configurations: PolicyConfiguration[],
): MetaTransactionData => ({
  to: policyEngine,
  value: '0',
  data: applyIface.encodeFunctionData('applyConfiguration', [toTuples(configurations)]),
})
