import { getAddress, isAddress } from 'ethers'
import type { Address } from 'viem'
import type { PolicyConfiguration } from '../shared/guardTx'
import { OPERATION_DELEGATECALL } from '../shared/accessSelector'
import { assemblePolicyBatch, type PolicyBatch, type PolicyBatchContext } from '../shared/buildPolicyBatch'
import { MULTI_SEND_SELECTOR, MULTI_SEND_POLICY_DATA } from './contracts'

export type BuildMultiSendPolicyBatchInput = PolicyBatchContext & {
  /** The MultiSendPolicy contract address. */
  policyContract: Address
  /**
   * The MultiSend deployment the Safe batches through — the access target. Resolve it from
   * the Safe's own version/chain rather than assuming one: a batch sent to a MultiSend this
   * policy is not bound to is checked by the fallback access instead, not by this policy.
   */
  multiSendAddress: Address
}

export type BuildMultiSendPolicyBatchResult = PolicyBatch

/**
 * Assembles the batch that puts MultiSend batches under the Safe's other policies.
 *
 * Without it a batch is one `multiSend` DELEGATECALL, so the guard checks that single call
 * and the individual transfers inside it go unexamined. With it, the policy re-enters the
 * engine for each sub-transaction, so every call in a batch faces the same policies it
 * would have faced on its own.
 *
 * The access is pinned to DELEGATECALL because that is what `MultiSendPolicy.configure`
 * requires and what a Safe batch actually is — a CALL-operation binding would be rejected
 * on configure.
 */
export const buildMultiSendPolicyBatch = (input: BuildMultiSendPolicyBatchInput): BuildMultiSendPolicyBatchResult => {
  const { policyContract, multiSendAddress } = input

  if (!isAddress(policyContract)) throw new Error('Missing or invalid MultiSendPolicy address')
  if (!isAddress(multiSendAddress)) throw new Error('Missing or invalid MultiSend address')

  const configurations: PolicyConfiguration[] = [
    {
      target: getAddress(multiSendAddress),
      selector: MULTI_SEND_SELECTOR,
      operation: OPERATION_DELEGATECALL,
      policy: policyContract,
      data: MULTI_SEND_POLICY_DATA,
    },
  ]

  return assemblePolicyBatch(input, configurations)
}
