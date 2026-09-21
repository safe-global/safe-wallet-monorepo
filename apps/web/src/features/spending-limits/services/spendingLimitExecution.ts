import type { SpendingLimitState, NewSpendingLimitData, SpendingLimitTxParams } from '../types'
import {
  getLatestSpendingLimitAddress,
  getDeployedSpendingLimitModuleAddress,
  getSpendingLimitContract,
} from './spendingLimitContracts'
import type { MetaTransactionData, SafeTransaction, TransactionOptions } from '@safe-global/types-kit'
import {
  createAddDelegateTx,
  createEnableModuleTx,
  createResetAllowanceTx,
  createSetAllowanceTx,
} from './spendingLimitParams'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
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

/** A recurring period is anchored this far in the past so its first window is already running. */
const RESET_BASE_OFFSET_MIN = 30

/** One `setAllowance` of the batch. `resetTime` is minutes as a string, `'0'` = one time. */
export type SpendingLimitPair = {
  beneficiary: string
  tokenAddress: string
  /** Human-readable, as typed. */
  amount: string
  /** Required: an unknown token never falls back to 18. */
  decimals: number
  resetTime: string
}

const pairKey = (beneficiary: string, tokenAddress: string): string =>
  `${beneficiary.toLowerCase()}:${tokenAddress.toLowerCase()}`

const assertValidPairs = (pairs: readonly SpendingLimitPair[]): void => {
  if (pairs.length === 0) throw new Error(EMPTY_SPENDING_LIMITS_ERROR)

  const seen = new Set<string>()
  for (const pair of pairs) {
    if (!Number.isInteger(pair.decimals)) throw new Error(UNKNOWN_TOKEN_DECIMALS_ERROR)
    const key = pairKey(pair.beneficiary, pair.tokenAddress)
    if (seen.has(key)) throw new Error(DUPLICATE_SPENDING_LIMIT_ERROR)
    seen.add(key)
  }
}

const uniqueBeneficiaries = (pairs: readonly SpendingLimitPair[]): string[] =>
  pairs.reduce<string[]>(
    (unique, pair) =>
      unique.some((known) => sameAddress(known, pair.beneficiary)) ? unique : [...unique, pair.beneficiary],
    [],
  )

const findExistingLimit = (
  existing: readonly SpendingLimitState[],
  pair: SpendingLimitPair,
): SpendingLimitState | undefined =>
  existing.find(
    (limit) => sameAddress(limit.beneficiary, pair.beneficiary) && sameAddress(limit.token.address, pair.tokenAddress),
  )

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
  pairs: readonly SpendingLimitPair[],
  existingSpendingLimits: readonly SpendingLimitState[],
  chainId: string,
  chain: Chain,
  safeModules: SafeState['modules'],
  deployed: boolean,
  scope?: TxSenderScope,
): Promise<SafeTransaction> => {
  assertValidPairs(pairs)
  const sdk = getAndValidateSafeSDK(scope)

  let spendingLimitAddress = deployed && getDeployedSpendingLimitModuleAddress(chainId, safeModules)
  const isModuleEnabled = !!spendingLimitAddress
  if (!isModuleEnabled) {
    spendingLimitAddress = getLatestSpendingLimitAddress(chainId)
  }
  if (!spendingLimitAddress) {
    throw new Error(NO_ALLOWANCE_MODULE_ERROR)
  }

  const txs: MetaTransactionData[] = []

  if (!deployed) {
    const enableModuleTx = await createEnableModuleTx(
      chain,
      await sdk.getAddress(),
      sdk.getContractVersion(),
      spendingLimitAddress,
    )
    txs.push({ to: enableModuleTx.to, value: '0', data: enableModuleTx.data })
  } else if (!isModuleEnabled) {
    const enableModuleTx = await sdk.createEnableModuleTx(spendingLimitAddress)
    txs.push({ to: enableModuleTx.data.to, value: '0', data: enableModuleTx.data.data })
  }

  for (const beneficiary of uniqueBeneficiaries(pairs)) {
    const isDelegate = existingSpendingLimits.some((limit) => sameAddress(limit.beneficiary, beneficiary))
    if (!isDelegate) txs.push(createAddDelegateTx(beneficiary, spendingLimitAddress))
  }

  for (const pair of pairs) {
    const existing = findExistingLimit(existingSpendingLimits, pair)
    if (existing && existing.spent !== '0') {
      txs.push(createResetAllowanceTx(pair.beneficiary, pair.tokenAddress, spendingLimitAddress))
    }

    const isOneTime = pair.resetTime === '0'
    txs.push(
      createSetAllowanceTx(
        pair.beneficiary,
        pair.tokenAddress,
        parseUnits(pair.amount, pair.decimals).toString(),
        parseInt(pair.resetTime),
        isOneTime ? 0 : currentMinutes() - RESET_BASE_OFFSET_MIN,
        spendingLimitAddress,
      ),
    )
  }

  return createMultiSendCallOnlyTx(txs, scope)
}

/** The Safe-level form's single pair, through the same batch builder. */
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

  const pair: SpendingLimitPair = {
    beneficiary: data.beneficiary,
    tokenAddress: data.tokenAddress,
    amount: data.amount,
    decimals: tokenDecimals,
    resetTime: data.resetTime,
  }
  return createSpendingLimitsTx([pair], spendingLimits, chainId, chain, safeModules, deployed, scope)
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
