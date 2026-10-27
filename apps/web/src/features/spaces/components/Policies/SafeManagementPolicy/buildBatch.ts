import { getAddress, isAddress } from 'ethers'
import type { Address } from 'viem'
import type { PolicyConfiguration } from '../shared/guardTx'
import { OPERATION_CALL } from '../shared/accessSelector'
import { assemblePolicyBatch, type PolicyBatch, type PolicyBatchContext } from '../shared/buildPolicyBatch'
import { SAFE_MANAGEMENT_POLICY_DATA, safeManagementFunctionBySelector, type SafeManagementFunction } from './contracts'

export type BuildSafeManagementBatchInput = PolicyBatchContext & {
  /** AllowPolicy — what each selected management function is bound to. */
  policyContract: Address
  /** The selectors to govern, from SAFE_MANAGEMENT_FUNCTIONS. */
  selectors: string[]
}

export type BuildSafeManagementBatchResult = PolicyBatch

/**
 * Assembles the batch that governs the Safe's own management functions.
 *
 * Each selected function becomes its own `(safe, selector, CALL)` access bound to
 * AllowPolicy, so it stays permitted under the guard. Unselected functions get no access of
 * their own and fall through to the fallback policy — which is where the restriction
 * actually comes from, so this is only meaningful alongside a Deny fallback.
 *
 * One access per function rather than one catch-all: the guard keys policies by access, so
 * per-selector entries are what lets a later change add or drop a single function without
 * touching the rest.
 */
export const buildSafeManagementBatch = (input: BuildSafeManagementBatchInput): BuildSafeManagementBatchResult => {
  const { safeAddress, policyContract, selectors } = input

  if (!isAddress(policyContract)) throw new Error('Missing or invalid AllowPolicy address')
  if (!isAddress(safeAddress)) throw new Error('Missing or invalid Safe address')
  if (selectors.length === 0) throw new Error('Select at least one management function')

  const target = getAddress(safeAddress)
  const seen = new Set<string>()

  const configurations: PolicyConfiguration[] = selectors.map((selector) => {
    const fn: SafeManagementFunction | undefined = safeManagementFunctionBySelector(selector)
    if (!fn) throw new Error(`Not a Safe management function: ${selector}`)
    if (seen.has(fn.selector)) throw new Error(`Duplicate management function: ${fn.signature}`)
    seen.add(fn.selector)

    return {
      target,
      selector: fn.selector,
      operation: OPERATION_CALL,
      policy: policyContract,
      data: SAFE_MANAGEMENT_POLICY_DATA,
    }
  })

  return assemblePolicyBatch(input, configurations)
}
