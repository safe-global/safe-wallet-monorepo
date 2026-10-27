import { isAddress } from 'ethers'
import type { Address } from 'viem'
import type { MetaTransactionData } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { accessId, isFallbackAccessId, NO_SELECTOR, OPERATION_CALL, OPERATION_DELEGATECALL } from './accessSelector'
import {
  buildSetGuardTx,
  buildSetModuleGuardTx,
  encodeConfiguration,
  encodeRequestConfiguration,
  computeConfigureRoot,
} from './guardTx'
import type { PolicyConfiguration } from './guardTx'
import { MULTI_SEND_POLICY_DATA, MULTI_SEND_SELECTOR } from '../MultiSendPolicy/contracts'
import type { MultiSendDefaults } from './defaultMultiSend'

/**
 * How the batch configures the guard:
 *  - `immediate`: guard not yet active → `configureImmediately` + `setGuard` + `setModuleGuard`,
 *    applied in one signed batch. It also binds every official MultiSendCallOnly to MultiSendPolicy and,
 *    unless the policy sets its own fallback, gives the fallback access to the default fallback policy.
 *  - `request`: guard already active in either slot → `requestConfiguration(root)` only. `configureImmediately`
 *    reverts in the guard's `checkTransaction` once it is live, so the change takes effect via a
 *    separate `applyConfiguration` once the on-chain DELAY has elapsed.
 */
export type ConfigureMode = 'immediate' | 'request'

/** What every policy builder resolves before it can assemble a batch. */
export type PolicyBatchContext = {
  safeAddress: Address
  /** The Safe's currently installed guard (from SafeState.guard), if any. */
  currentGuard?: Address
  /** The Safe's currently installed module guard, if any. */
  currentModuleGuard?: Address
  /** The SafePolicyGuard deployment for this chain. */
  safePolicyGuard: Address
  /** The policy a first setup installs as the fallback; undefined installs none. */
  fallbackPolicy: Address | undefined
  /** The MultiSendPolicy a first setup binds batches to, so each call in a batch faces the other policies. */
  multiSendDefaults?: MultiSendDefaults
  /**
   * Allow overwriting a DIFFERENT (non-policy) guard already on the Safe, in either slot. Guard-rail:
   * without it the builder throws, since the setters would silently replace the existing guard. Wizards
   * set it only after an explicit confirmation.
   */
  allowOverwriteGuard?: boolean
}

export type PolicyBatch = {
  txs: MetaTransactionData[]
  mode: ConfigureMode
  /** The Configuration[] the batch commits to — persisted so a later applyConfiguration can replay it. */
  configurations: PolicyConfiguration[]
  /** keccak256(abi.encode(configurations)) — the on-chain configureRoot. */
  configureRoot: string
}

const isSameGuard = (a: string | undefined, b: string): boolean => !!a && a.toLowerCase() === b.toLowerCase()

const withDefaultMultiSend = (
  configurations: PolicyConfiguration[],
  multiSendDefaults: MultiSendDefaults | undefined,
): PolicyConfiguration[] => {
  if (!multiSendDefaults) return configurations
  if (!isAddress(multiSendDefaults.policy)) throw new Error('Invalid MultiSendPolicy address')

  const configured = new Set(configurations.map((configuration) => accessId(configuration)))
  const bindings = multiSendDefaults.targets
    .map((target) => ({
      target,
      selector: MULTI_SEND_SELECTOR,
      operation: OPERATION_DELEGATECALL,
      policy: multiSendDefaults.policy,
      data: MULTI_SEND_POLICY_DATA,
    }))
    .filter((binding) => !configured.has(accessId(binding)))

  return [...configurations, ...bindings]
}

// The guard refuses any call no access covers, so a first setup without a fallback would block everything else
const withDefaultFallback = (
  configurations: PolicyConfiguration[],
  fallbackPolicy: Address | undefined,
): PolicyConfiguration[] => {
  if (!fallbackPolicy) return configurations
  if (configurations.some((configuration) => isFallbackAccessId(accessId(configuration)))) return configurations
  if (!isAddress(fallbackPolicy)) throw new Error('Invalid default fallback policy address')

  return [
    ...configurations,
    ...[OPERATION_CALL, OPERATION_DELEGATECALL].map((operation) => ({
      target: ZERO_ADDRESS,
      selector: NO_SELECTOR,
      operation,
      policy: fallbackPolicy,
      data: '0x',
    })),
  ]
}

/**
 * Turns a policy's `Configuration[]` into the transactions that commit it.
 *
 * Every guard-enforced policy reaches the chain the same way — only the configurations differ —
 * so each builder's job is to produce those, and this decides how they are installed. Pure: the
 * caller resolves the addresses and the Safe's current guard and passes them in.
 */
export const assemblePolicyBatch = (
  {
    safeAddress,
    currentGuard,
    currentModuleGuard,
    safePolicyGuard,
    fallbackPolicy,
    multiSendDefaults,
    allowOverwriteGuard,
  }: PolicyBatchContext,
  configurations: PolicyConfiguration[],
): PolicyBatch => {
  if (!isAddress(safePolicyGuard)) throw new Error('Missing or invalid SafePolicyGuard address')
  if (configurations.length === 0) throw new Error('A policy needs at least one configuration')

  // configureImmediately reverts once the policy guard is in either slot
  const guardAlreadySet = [currentGuard, currentModuleGuard].some((guard) => isSameGuard(guard, safePolicyGuard))
  const hasForeignGuard = [currentGuard, currentModuleGuard].some(
    (guard) => !!guard && !isSameGuard(guard, safePolicyGuard),
  )
  if (!guardAlreadySet && hasForeignGuard && !allowOverwriteGuard) {
    throw new Error('A different guard is already set on this Safe; overwriting it must be confirmed')
  }

  if (guardAlreadySet) {
    return {
      txs: [encodeRequestConfiguration(safePolicyGuard, configurations)],
      mode: 'request',
      configurations,
      configureRoot: computeConfigureRoot(configurations),
    }
  }

  const installed = withDefaultFallback(withDefaultMultiSend(configurations, multiSendDefaults), fallbackPolicy)

  // Configure BEFORE installing the guard. `configureImmediately` opens with
  // `require(!_isGuardEnabled(msg.sender), GuardAlreadyEnabled())`, so with `setGuard` first
  // the second call reverts and takes the whole batch with it. The guard checks its own
  // state rather than relying on `checkTransaction`, which the contract notes is deliberate:
  // a permissive fallback policy would otherwise let a CALL through and defeat the timelock.
  return {
    txs: [
      encodeConfiguration(safePolicyGuard, installed),
      buildSetGuardTx(safeAddress, safePolicyGuard),
      buildSetModuleGuardTx(safeAddress, safePolicyGuard),
    ],
    mode: 'immediate',
    configurations: installed,
    configureRoot: computeConfigureRoot(installed),
  }
}
