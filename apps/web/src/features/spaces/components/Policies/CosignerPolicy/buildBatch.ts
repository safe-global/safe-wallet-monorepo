import { AbiCoder, getAddress, isAddress } from 'ethers'
import type { Address } from 'viem'
import type { MetaTransactionData } from '@safe-global/types-kit'
import {
  buildSetGuardTx,
  encodeConfiguration,
  encodeRequestConfiguration,
  computeConfigureRoot,
  OPERATION_CALL,
  type PolicyConfiguration,
} from '../shared/guardTx'
import { NO_SELECTOR, OPERATION_DELEGATECALL, type Access } from '../shared/accessSelector'
import { COSIGNER_DATA_TYPE } from './contracts'
import type { ConfigureMode } from '../ERC20TransferPolicy/buildBatch'

export type BuildCosignerBatchInput = {
  safeAddress: Address
  /** The Safe's currently installed guard (from SafeState.guard), if any. */
  currentGuard?: Address
  /** The SafePolicyGuard address for this chain (from the policy response). */
  safePolicyGuard: Address
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
  /**
   * Allow overwriting a DIFFERENT (non-policy) guard already on the Safe. By default the
   * builder throws, since `setGuard` would silently replace it.
   */
  allowOverwriteGuard?: boolean
}

export type BuildCosignerBatchResult = {
  txs: MetaTransactionData[]
  mode: ConfigureMode
  configurations: PolicyConfiguration[]
  configureRoot: string
}

const isSameGuard = (a: string | undefined, b: string): boolean => !!a && a.toLowerCase() === b.toLowerCase()

/** `abi.encode(address cosigner)` — the whole payload CoSignerPolicy.configure decodes. */
const encodeCosigner = (cosigner: string): string =>
  AbiCoder.defaultAbiCoder().encode([COSIGNER_DATA_TYPE], [getAddress(cosigner)])

/**
 * Assembles the multi-send that requires a cosigner on the given accesses.
 *
 * Guard NOT yet active (`immediate`): `setGuard` + `configureImmediately`.
 * Guard ALREADY active (`request`): `requestConfiguration(root)` only — the change applies
 * via a separate `applyConfiguration` once the guard's delay has elapsed.
 *
 * Pure — no network. Mirrors the token-withdraw builder; the only policy-specific part is
 * the `data` payload, which is a bare address.
 */
export const buildCosignerBatch = (input: BuildCosignerBatchInput): BuildCosignerBatchResult => {
  const { safeAddress, currentGuard, safePolicyGuard, policyContract, cosigner, accesses } = input

  if (!isAddress(safePolicyGuard)) throw new Error('Missing or invalid SafePolicyGuard address')
  if (!isAddress(policyContract)) throw new Error('Missing or invalid CoSignerPolicy address')
  if (!isAddress(cosigner)) throw new Error('Missing or invalid cosigner address')
  if (accesses.length === 0) throw new Error('Add at least one call to cosign')

  const guardAlreadySet = isSameGuard(currentGuard, safePolicyGuard)
  const hasUnknownGuard = !!currentGuard && !guardAlreadySet
  if (hasUnknownGuard && !input.allowOverwriteGuard) {
    throw new Error('A different transaction guard is already set on this Safe; overwriting it must be confirmed')
  }

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
