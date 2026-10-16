import { getAddress, isAddress } from 'ethers'
import type { Address } from 'viem'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import type { PolicyConfiguration } from '../shared/guardTx'
import { NO_SELECTOR, OPERATION_CALL } from '../shared/accessSelector'
import { assemblePolicyBatch, type PolicyBatch, type PolicyBatchContext } from '../shared/buildPolicyBatch'
import { policyContractName } from '../shared/policyDeployments'
import { FALLBACK_POLICY_DATA, type FallbackPolicyType } from './contracts'

export type BuildFallbackPolicyBatchInput = PolicyBatchContext & {
  /** The Allow / Deny / NativeTransfer policy contract (from the policy response). */
  policyContract: Address
  policyType: FallbackPolicyType
  /**
   * Native transfers only: restrict the policy to one recipient instead of the catch-all.
   * Allow and Deny always occupy the fallback access itself.
   */
  target?: Address
}

export type BuildFallbackPolicyBatchResult = PolicyBatch

/**
 * Assembles the multi-send that installs one of the fallback policies.
 *
 * The access is always a plain value-transfer key — no selector, CALL — because that is
 * what `NativeTransferPolicy.configure` accepts and what the fallback slot is. None of the
 * three policies reads a payload, so `data` is empty.
 */
export const buildFallbackPolicyBatch = (input: BuildFallbackPolicyBatchInput): BuildFallbackPolicyBatchResult => {
  const { policyContract, policyType, target } = input

  if (!isAddress(policyContract)) throw new Error(`Missing or invalid ${policyContractName(policyType)} address`)

  // Allow and Deny are the catch-all itself; only native transfers may be narrowed.
  if (target && policyType !== PolicyType.NativeTransfer) {
    throw new Error(`${policyContractName(policyType)} occupies the fallback access and cannot be scoped to a target`)
  }
  if (target && !isAddress(target)) throw new Error(`Invalid target address: ${target}`)

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

  return assemblePolicyBatch(input, configurations)
}
