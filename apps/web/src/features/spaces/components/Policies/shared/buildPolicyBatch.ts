import { isAddress } from 'ethers'
import type { Address } from 'viem'
import type { MetaTransactionData } from '@safe-global/types-kit'
import {
  buildSetGuardTx,
  buildSetModuleGuardTx,
  encodeConfiguration,
  encodeRequestConfiguration,
  computeConfigureRoot,
} from './guardTx'
import type { PolicyConfiguration } from './guardTx'

/**
 * How the batch configures the guard:
 *  - `immediate`: guard not yet active → `configureImmediately` + `setGuard` + `setModuleGuard`,
 *    applied in one signed batch.
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

/**
 * Turns a policy's `Configuration[]` into the transactions that commit it.
 *
 * Every guard-enforced policy reaches the chain the same way — only the configurations differ —
 * so each builder's job is to produce those, and this decides how they are installed. Pure: the
 * caller resolves the addresses and the Safe's current guard and passes them in.
 */
export const assemblePolicyBatch = (
  { safeAddress, currentGuard, currentModuleGuard, safePolicyGuard, allowOverwriteGuard }: PolicyBatchContext,
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

  const configureRoot = computeConfigureRoot(configurations)

  if (guardAlreadySet) {
    return {
      txs: [encodeRequestConfiguration(safePolicyGuard, configurations)],
      mode: 'request',
      configurations,
      configureRoot,
    }
  }

  // Configure BEFORE installing the guard. `configureImmediately` opens with
  // `require(!_isGuardEnabled(msg.sender), GuardAlreadyEnabled())`, so with `setGuard` first
  // the second call reverts and takes the whole batch with it. The guard checks its own
  // state rather than relying on `checkTransaction`, which the contract notes is deliberate:
  // a permissive fallback policy would otherwise let a CALL through and defeat the timelock.
  return {
    txs: [
      encodeConfiguration(safePolicyGuard, configurations),
      buildSetGuardTx(safeAddress, safePolicyGuard),
      buildSetModuleGuardTx(safeAddress, safePolicyGuard),
    ],
    mode: 'immediate',
    configurations,
    configureRoot,
  }
}
