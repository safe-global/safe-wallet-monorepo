import { getAddress, isAddress } from 'ethers'
import type { Address } from 'viem'
import type { MetaTransactionData } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import {
  buildSetGuardTx,
  encodeConfiguration,
  encodeRequestConfiguration,
  computeConfigureRoot,
  type PolicyConfiguration,
} from '../shared/guardTx'
import { NO_SELECTOR, OPERATION_CALL } from '../shared/accessSelector'
import type { ConfigureMode } from '../ERC20TransferPolicy/buildBatch'
import { FALLBACK_POLICY_DATA, type FallbackPolicyType } from './contracts'

export type BuildFallbackPolicyBatchInput = {
  safeAddress: Address
  /** The Safe's currently installed guard (from SafeState.guard), if any. */
  currentGuard?: Address
  /** The SafePolicyGuard address for this chain (from the policy response). */
  safePolicyGuard: Address
  /** The Allow / Deny / NativeTransfer policy contract (from the policy response). */
  policyContract: Address
  policyType: FallbackPolicyType
  /**
   * Native transfers only: restrict the policy to one recipient instead of the catch-all.
   * Allow and Deny always occupy the fallback access itself.
   */
  target?: Address
  /** Allow overwriting a DIFFERENT (non-policy) guard already on the Safe. */
  allowOverwriteGuard?: boolean
}

export type BuildFallbackPolicyBatchResult = {
  txs: MetaTransactionData[]
  mode: ConfigureMode
  configurations: PolicyConfiguration[]
  configureRoot: string
}

const isSameGuard = (a: string | undefined, b: string): boolean => !!a && a.toLowerCase() === b.toLowerCase()

/**
 * Assembles the multi-send that installs one of the fallback policies.
 *
 * The access is always a plain value-transfer key — no selector, CALL — because that is
 * what `NativeTransferPolicy.configure` accepts and what the fallback slot is. None of the
 * three policies reads a payload, so `data` is empty.
 *
 * Guard NOT yet active (`immediate`): `setGuard` + `configureImmediately`.
 * Guard ALREADY active (`request`): `requestConfiguration(root)`, applied after the delay.
 */
export const buildFallbackPolicyBatch = (input: BuildFallbackPolicyBatchInput): BuildFallbackPolicyBatchResult => {
  const { safeAddress, currentGuard, safePolicyGuard, policyContract, policyType, target } = input

  if (!isAddress(safePolicyGuard)) throw new Error('Missing or invalid SafePolicyGuard address')
  if (!isAddress(policyContract)) throw new Error(`Missing or invalid ${policyType} address`)

  // Allow and Deny are the catch-all itself; only native transfers may be narrowed.
  if (target && policyType !== PolicyType.NativeTransfer) {
    throw new Error(`${policyType} occupies the fallback access and cannot be scoped to a target`)
  }
  if (target && !isAddress(target)) throw new Error(`Invalid target address: ${target}`)

  const guardAlreadySet = isSameGuard(currentGuard, safePolicyGuard)
  const hasUnknownGuard = !!currentGuard && !guardAlreadySet
  if (hasUnknownGuard && !input.allowOverwriteGuard) {
    throw new Error('A different transaction guard is already set on this Safe; overwriting it must be confirmed')
  }

  const configurations: PolicyConfiguration[] = [
    {
      target: target ? getAddress(target) : ZERO_ADDRESS,
      selector: NO_SELECTOR,
      // NativeTransferPolicy.configure returns false for DELEGATECALL, which reverts the
      // configuration — so this is CALL for all three, not a default worth overriding.
      operation: OPERATION_CALL,
      policy: policyContract,
      data: FALLBACK_POLICY_DATA,
    },
  ]

  const configureRoot = computeConfigureRoot(configurations)

  if (guardAlreadySet) {
    return {
      txs: [encodeRequestConfiguration(safePolicyGuard, configurations)],
      mode: 'request',
      configurations,
      configureRoot,
    }
  }

  return {
    txs: [buildSetGuardTx(safeAddress, safePolicyGuard), encodeConfiguration(safePolicyGuard, configurations)],
    mode: 'immediate',
    configurations,
    configureRoot,
  }
}
