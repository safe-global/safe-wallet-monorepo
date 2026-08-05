import type { SpendingLimitState, NewSpendingLimitData, SpendingLimitTxParams } from '../types'
import { getSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import {
  getLatestSpendingLimitAddress,
  getDeployedSpendingLimitModuleAddress,
  getSpendingLimitContract,
} from './spendingLimitContracts'
import type { MetaTransactionData, TransactionOptions } from '@safe-global/types-kit'
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
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { didRevert } from '@/utils/ethers-utils'
import { getUncheckedSigner } from '@/services/tx/tx-sender/sdk'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export const findExistingSpendingLimit = (
  spendingLimits: SpendingLimitState[],
  beneficiary: string,
  tokenAddress: string,
): SpendingLimitState | undefined =>
  spendingLimits.find(
    (spendingLimit) =>
      sameAddress(spendingLimit.beneficiary, beneficiary) && sameAddress(spendingLimit.token.address, tokenAddress),
  )

export const createNewSpendingLimitTx = async (
  data: NewSpendingLimitData,
  spendingLimits: SpendingLimitState[],
  chainId: string,
  chain: Chain,
  safeModules: SafeState['modules'],
  deployed: boolean,
) => {
  const sdk = getSafeSDK()
  if (!sdk) return

  let spendingLimitAddress = deployed && getDeployedSpendingLimitModuleAddress(chainId, safeModules)
  const isModuleEnabled = !!spendingLimitAddress
  if (!isModuleEnabled) {
    spendingLimitAddress = getLatestSpendingLimitAddress(chainId)
  }
  if (!spendingLimitAddress) return

  const txs: MetaTransactionData[] = []

  if (!deployed) {
    const enableModuleTx = await createEnableModuleTx(
      chain,
      await sdk.getAddress(),
      sdk.getContractVersion(),
      spendingLimitAddress,
    )

    const tx = {
      to: enableModuleTx.to,
      value: '0',
      data: enableModuleTx.data,
    }

    txs.push(tx)
  } else {
    if (!isModuleEnabled) {
      const enableModuleTx = await sdk.createEnableModuleTx(spendingLimitAddress)

      const tx = {
        to: enableModuleTx.data.to,
        value: '0',
        data: enableModuleTx.data.data,
      }
      txs.push(tx)
    }
  }

  // addDelegate is per beneficiary, not per token, so it is only ever needed once
  const existingDelegate = spendingLimits.find((spendingLimit) =>
    sameAddress(spendingLimit.beneficiary, data.beneficiary),
  )
  if (!existingDelegate) {
    txs.push(createAddDelegateTx(data.beneficiary, spendingLimitAddress))
  }

  data.limits.forEach(({ tokenAddress, amount, resetTime, decimals }) => {
    // setAllowance does not clear the spent amount, so an already-spent allowance has to be reset first
    const existingSpendingLimit = findExistingSpendingLimit(spendingLimits, data.beneficiary, tokenAddress)
    if (existingSpendingLimit && existingSpendingLimit.spent !== '0') {
      txs.push(createResetAllowanceTx(data.beneficiary, tokenAddress, spendingLimitAddress))
    }

    txs.push(
      createSetAllowanceTx(
        data.beneficiary,
        tokenAddress,
        parseUnits(amount, decimals ?? undefined).toString(),
        parseInt(resetTime),
        resetTime !== '0' ? currentMinutes() - 30 : 0,
        spendingLimitAddress,
      ),
    )
  })

  return createMultiSendCallOnlyTx(txs)
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
