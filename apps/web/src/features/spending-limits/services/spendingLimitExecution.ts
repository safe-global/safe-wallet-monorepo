import type { SpendingLimitState, NewSpendingLimitData, SpendingLimitTxParams } from '../types'
import {
  getLatestSpendingLimitAddress,
  getDeployedSpendingLimitModuleAddress,
  getSpendingLimitContract,
} from './spendingLimitContracts'
import { distinctAddresses, isSpendingLimitFor } from './spendingLimitMatching'
import type { SpendingLimitEdit } from './spendingLimitEdit'
import type { MetaTransactionData, SafeTransaction, TransactionOptions } from '@safe-global/types-kit'
import {
  createAddDelegateTx,
  createDeleteAllowanceTx,
  createEnableModuleTx,
  createRemoveDelegateTx,
  createResetAllowanceTx,
  createSetAllowanceTx,
} from './spendingLimitParams'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type Safe from '@safe-global/protocol-kit'
import type { ContractTransactionResponse, Eip1193Provider } from 'ethers'
import { parseUnits } from 'ethers'
import { currentMinutes } from '@safe-global/utils/utils/date'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { didRevert } from '@/utils/ethers-utils'
import { getAndValidateSafeSDK, getUncheckedSigner } from '@/services/tx/tx-sender/sdk'
import type { TxSenderScope } from '@/components/tx-flow/safe-scope/types'
import { asError } from '@safe-global/utils/services/exceptions/utils'

export const NO_ALLOWANCE_MODULE_ERROR =
  'The spending limit module is not available on this network, so the transaction could not be created.'
export const EMPTY_SPENDING_LIMITS_ERROR = 'The policy has no spender and token to set a limit for.'
export const DUPLICATE_SPENDING_LIMIT_ERROR = 'The same spender and token appear twice in the policy.'
export const UNKNOWN_TOKEN_DECIMALS_ERROR =
  'The decimals of a selected token are unknown, so its limit cannot be encoded.'
export const EMPTY_SPENDING_LIMIT_EDIT_ERROR = 'This edit changes nothing, so there is no transaction to sign.'
export const MODULE_NOT_ENABLED_ERROR =
  'The spending limit module is not enabled on this Safe account, so its limits cannot be edited.'

/** A recurring period is anchored this far in the past so its first window is already running. */
const RESET_BASE_OFFSET_MIN = 30

/** One allowance as the flow wants it set, against `SpendingLimitState` as the chain holds it. `resetTime` is minutes as a string, `'0'` = one time. */
export type DesiredAllowance = {
  beneficiary: string
  tokenAddress: string
  /** Human-readable, as typed. */
  amount: string
  /** Required: an unknown token never falls back to 18. */
  decimals: number
  resetTime: string
}

const allowanceKey = (beneficiary: string, tokenAddress: string): string =>
  `${beneficiary.toLowerCase()}:${tokenAddress.toLowerCase()}`

const assertValidAllowances = (desired: readonly DesiredAllowance[]): void => {
  if (desired.length === 0) throw new Error(EMPTY_SPENDING_LIMITS_ERROR)

  const seen = new Set<string>()
  for (const allowance of desired) {
    if (!Number.isInteger(allowance.decimals)) throw new Error(UNKNOWN_TOKEN_DECIMALS_ERROR)
    const key = allowanceKey(allowance.beneficiary, allowance.tokenAddress)
    if (seen.has(key)) throw new Error(DUPLICATE_SPENDING_LIMIT_ERROR)
    seen.add(key)
  }
}

const findExistingLimit = (
  existing: readonly SpendingLimitState[],
  allowance: DesiredAllowance,
): SpendingLimitState | undefined =>
  existing.find((limit) => isSpendingLimitFor(limit, allowance.beneficiary, allowance.tokenAddress))

type AllowanceModule = { address: string; isEnabled: boolean }

/** The module the batch talks to: the one the Safe already runs, else the newest one registered on the chain. */
const resolveAllowanceModule = (
  chainId: string,
  safeModules: SafeState['modules'],
  deployed: boolean,
): AllowanceModule => {
  const enabledAddress = deployed ? getDeployedSpendingLimitModuleAddress(chainId, safeModules) : undefined
  if (enabledAddress) return { address: enabledAddress, isEnabled: true }

  const latestAddress = getLatestSpendingLimitAddress(chainId)
  if (!latestAddress) throw new Error(NO_ALLOWANCE_MODULE_ERROR)
  return { address: latestAddress, isEnabled: false }
}

/** `enableModule` on the Safe; a counterfactual Safe has no contract to ask, so its call is encoded by hand. */
const createEnableModuleMetaTx = async (
  sdk: Safe,
  chain: Chain,
  deployed: boolean,
  moduleAddress: string,
): Promise<MetaTransactionData> => {
  if (!deployed) {
    const tx = await createEnableModuleTx(chain, await sdk.getAddress(), sdk.getContractVersion(), moduleAddress)
    return { to: tx.to, value: '0', data: tx.data }
  }
  const { data } = await sdk.createEnableModuleTx(moduleAddress)
  return { to: data.to, value: '0', data: data.data }
}

/** One `setAllowance`: the amount in the token's base units, the period in minutes, and when its first window starts. */
const createSetAllowanceMetaTx = (allowance: DesiredAllowance, moduleAddress: string): MetaTransactionData => {
  const isOneTime = allowance.resetTime === '0'
  return createSetAllowanceTx(
    allowance.beneficiary,
    allowance.tokenAddress,
    parseUnits(allowance.amount, allowance.decimals).toString(),
    parseInt(allowance.resetTime, 10),
    isOneTime ? 0 : currentMinutes() - RESET_BASE_OFFSET_MIN,
    moduleAddress,
  )
}

/**
 * One multiSend for a whole policy: enable the AllowanceModule if needed, register every new
 * spender, then one `setAllowance` per (spender, token) with that row's own reset period. This
 * order is the contract CGW relies on when decoding a queued policy (WA-3154).
 *
 * Never resolves `undefined`: the review step feeds the result straight into `setSafeTx`, so a
 * silent `undefined` leaves `ReviewTransaction` on its skeleton forever with no error and no chain
 * interaction (WA-2305 / CUS-132). Every unmet precondition therefore throws.
 */
export const createSpendingLimitsTx = async (
  desired: readonly DesiredAllowance[],
  existingSpendingLimits: readonly SpendingLimitState[],
  chainId: string,
  chain: Chain,
  safeModules: SafeState['modules'],
  deployed: boolean,
  scope?: TxSenderScope,
): Promise<SafeTransaction> => {
  assertValidAllowances(desired)
  const sdk = getAndValidateSafeSDK(scope)
  const allowanceModule = resolveAllowanceModule(chainId, safeModules, deployed)

  const txs: MetaTransactionData[] = []

  if (!allowanceModule.isEnabled) {
    txs.push(await createEnableModuleMetaTx(sdk, chain, deployed, allowanceModule.address))
  }

  for (const beneficiary of distinctAddresses(desired.map((allowance) => allowance.beneficiary))) {
    const isDelegate = existingSpendingLimits.some((limit) => sameAddress(limit.beneficiary, beneficiary))
    if (!isDelegate) txs.push(createAddDelegateTx(beneficiary, allowanceModule.address))
  }

  for (const allowance of desired) {
    const existing = findExistingLimit(existingSpendingLimits, allowance)
    // `setAllowance` keeps `spent`, so a used-up allowance is zeroed first or the new limit starts partly consumed.
    if (existing && existing.spent !== '0') {
      txs.push(createResetAllowanceTx(allowance.beneficiary, allowance.tokenAddress, allowanceModule.address))
    }
    txs.push(createSetAllowanceMetaTx(allowance, allowanceModule.address))
  }

  return createMultiSendCallOnlyTx(txs, scope)
}

const hasChanges = (edit: SpendingLimitEdit): boolean =>
  edit.addedDelegates.length > 0 ||
  edit.added.length > 0 ||
  edit.modified.length > 0 ||
  edit.removed.length > 0 ||
  edit.removedDelegates.length > 0

/**
 * One multiSend for an edit. Clearing precedes unregistering because `removeDelegate` leaves the stored
 * allowance behind, which re-adding the spender later would resurrect.
 */
export const createSpendingLimitEditTx = async (
  edit: SpendingLimitEdit,
  existingSpendingLimits: readonly SpendingLimitState[],
  chainId: string,
  safeModules: SafeState['modules'],
  deployed: boolean,
  scope?: TxSenderScope,
): Promise<SafeTransaction> => {
  if (!hasChanges(edit)) throw new Error(EMPTY_SPENDING_LIMIT_EDIT_ERROR)
  getAndValidateSafeSDK(scope)
  const { address, isEnabled } = resolveAllowanceModule(chainId, safeModules, deployed)
  if (!isEnabled) throw new Error(MODULE_NOT_ENABLED_ERROR)

  const writes = [...edit.added, ...edit.modified]

  // `addDelegate` returns silently for a delegate the module already knows, while `setAllowance`
  // reverts for one it does not. Registering every spender written to therefore costs one call and
  // survives a baseline that a transaction queued in the meantime has already made stale.
  const txs: MetaTransactionData[] = distinctAddresses(writes.map((allowance) => allowance.beneficiary)).map(
    (delegate) => createAddDelegateTx(delegate, address),
  )

  for (const allowance of writes) {
    const existing = findExistingLimit(existingSpendingLimits, allowance)
    if (existing && existing.spent !== '0') {
      txs.push(createResetAllowanceTx(allowance.beneficiary, allowance.tokenAddress, address))
    }
    txs.push(createSetAllowanceMetaTx(allowance, address))
  }

  for (const limit of edit.removed) {
    txs.push(createDeleteAllowanceTx(limit.beneficiary, limit.tokenAddress, address))
  }

  for (const delegate of edit.removedDelegates) {
    txs.push(createRemoveDelegateTx(delegate, address))
  }

  return createMultiSendCallOnlyTx(txs, scope)
}

/** The Safe-level form's single allowance, through the same batch builder. */
export const createNewSpendingLimitTx = async (
  data: NewSpendingLimitData,
  spendingLimits: SpendingLimitState[],
  chainId: string,
  chain: Chain,
  safeModules: SafeState['modules'],
  deployed: boolean,
  tokenDecimals?: number | null,
  scope?: TxSenderScope,
): Promise<SafeTransaction> => {
  if (tokenDecimals == null) throw new Error(UNKNOWN_TOKEN_DECIMALS_ERROR)

  const allowance: DesiredAllowance = {
    beneficiary: data.beneficiary,
    tokenAddress: data.tokenAddress,
    amount: data.amount,
    decimals: tokenDecimals,
    resetTime: data.resetTime,
  }
  return createSpendingLimitsTx([allowance], spendingLimits, chainId, chain, safeModules, deployed, scope)
}

export const dispatchSpendingLimitTxExecution = async (
  txParams: SpendingLimitTxParams,
  txOptions: TransactionOptions,
  provider: Eip1193Provider,
  chainId: SafeState['chainId'],
  safeAddress: string,
  safeModules: SafeState['modules'],
) => {
  const id = JSON.stringify(txParams)

  let result: ContractTransactionResponse | undefined
  try {
    const signer = await getUncheckedSigner(provider)
    const contract = getSpendingLimitContract(chainId, safeModules, signer)

    result = await contract.executeAllowanceTransfer(
      txParams.safeAddress,
      txParams.token,
      txParams.to,
      txParams.amount,
      txParams.paymentToken,
      txParams.payment,
      txParams.delegate,
      txParams.signature,
      txOptions,
    )
    txDispatch(TxEvent.EXECUTING, { groupKey: id, chainId, safeAddress })
  } catch (error) {
    txDispatch(TxEvent.FAILED, { groupKey: id, chainId, safeAddress, error: asError(error) })
    throw error
  }

  txDispatch(TxEvent.PROCESSING_MODULE, {
    groupKey: id,
    txHash: result.hash,
  })

  result
    ?.wait()
    .then((receipt) => {
      if (receipt === null) {
        txDispatch(TxEvent.FAILED, {
          groupKey: id,
          chainId,
          safeAddress,
          error: new Error('No transaction receipt found'),
        })
      } else if (didRevert(receipt)) {
        txDispatch(TxEvent.REVERTED, {
          groupKey: id,
          chainId,
          safeAddress,
          error: new Error('Transaction reverted by EVM'),
        })
      } else {
        txDispatch(TxEvent.PROCESSED, { groupKey: id, chainId, safeAddress, txHash: receipt.hash })
      }
    })
    .catch((err) => {
      txDispatch(TxEvent.FAILED, { groupKey: id, chainId, safeAddress, error: asError(err) })
    })

  return result?.hash
}
