import { AbiCoder, getAddress, isAddress } from 'ethers'
import type { Address } from 'viem'
import { OPERATION_CALL, type PolicyConfiguration } from '../shared/guardTx'
import { NO_SELECTOR, OPERATION_DELEGATECALL, type Access } from '../shared/accessSelector'
import { assemblePolicyBatch, type PolicyBatch, type PolicyBatchContext } from '../shared/buildPolicyBatch'
import { COSIGNER_DATA_TYPE } from './contracts'

export type BuildCosignerBatchInput = PolicyBatchContext & {
  /** The CoSignerPolicy contract address (from the policy response). */
  policyContract: Address
  /** The address whose signature every matching transaction will require. */
  cosigner: Address
  /**
   * The accesses to cosign: a target, an optional 4-byte selector (empty covers calls
   * with no function data, i.e. plain value transfers) and the operation. Note the
   * access carries no value — the policy applies whatever the amount.
   */
  accesses: Array<Pick<Access, 'target'> & Partial<Access>>
}

export type BuildCosignerBatchResult = PolicyBatch

/** `abi.encode(address cosigner)` — the whole payload CoSignerPolicy.configure decodes. */
const encodeCosigner = (cosigner: string): string =>
  AbiCoder.defaultAbiCoder().encode([COSIGNER_DATA_TYPE], [getAddress(cosigner)])

/**
 * Assembles the multi-send that requires a cosigner on the given accesses.
 *
 * The only policy-specific part is the `data` payload, which is a bare address; how the
 * configurations reach the chain is shared with every other guard policy.
 */
export const buildCosignerBatch = (input: BuildCosignerBatchInput): BuildCosignerBatchResult => {
  const { policyContract, cosigner, accesses } = input

  if (!isAddress(policyContract)) throw new Error('Missing or invalid CoSignerPolicy address')
  if (!isAddress(cosigner)) throw new Error('Missing or invalid cosigner address')
  if (accesses.length === 0) throw new Error('Add at least one call to cosign')

  const data = encodeCosigner(cosigner)

  const configurations: PolicyConfiguration[] = accesses.map((access) => {
    if (!isAddress(access.target)) throw new Error(`Invalid target address: ${access.target}`)
    const selector = access.selector || NO_SELECTOR
    if (!/^0x[0-9a-fA-F]{8}$/.test(selector)) throw new Error(`Invalid function selector: ${access.selector}`)

    return {
      target: getAddress(access.target),
      selector: selector.toLowerCase(),
      operation: access.operation === OPERATION_DELEGATECALL ? OPERATION_DELEGATECALL : OPERATION_CALL,
      policy: policyContract,
      data,
    }
  })

  return assemblePolicyBatch(input, configurations)
}
