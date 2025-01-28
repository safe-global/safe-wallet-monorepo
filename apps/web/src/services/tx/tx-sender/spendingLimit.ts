import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import { getSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { getSpendingLimitModuleAddress } from '@/services/contracts/spendingLimitContracts'
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import {
  createAddDelegateTx,
  createEnableModuleTx,
  createResetAllowanceTx,
  createSetAllowanceTx,
} from '@/services/tx/spendingLimitParams'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { parseUnits } from 'ethers'
import { currentMinutes } from '@/utils/date'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'

export type NewSpendingLimitData = {
  beneficiary: string
  tokenAddress: string
  amount: string
  resetTime: string
}

export const createNewSpendingLimitTx = async (
  data: NewSpendingLimitData,
  spendingLimits: SpendingLimitState[],
  chainId: string,
  chain: ChainInfo | undefined,
  deployed: boolean,
  tokenDecimals?: number | null,
  existingSpendingLimit?: SpendingLimitState,
) => {
  const sdk = getSafeSDK()
  const spendingLimitAddress = getSpendingLimitModuleAddress(chainId)
  if (!spendingLimitAddress || !sdk) return

  const txs: MetaTransactionData[] = []

  if (!deployed) {
    if (!chain) return

    const enableModuleTx = await createEnableModuleTx(
      chain,
      await sdk.getAddress(),
      await sdk.getContractVersion(),
      spendingLimitAddress,
    )

    const tx = {
      to: enableModuleTx.to,
      value: '0',
      data: enableModuleTx.data,
    }

    txs.push(tx)
  } else {
    const isSpendingLimitEnabled = await sdk.isModuleEnabled(spendingLimitAddress)
    if (!isSpendingLimitEnabled) {
      const enableModuleTx = await sdk.createEnableModuleTx(spendingLimitAddress)

      const tx = {
        to: enableModuleTx.data.to,
        value: '0',
        data: enableModuleTx.data.data,
      }
      txs.push(tx)
    }
  }

  const existingDelegate = spendingLimits.find((spendingLimit) => spendingLimit.beneficiary === data.beneficiary)
  if (!existingDelegate) {
    txs.push(createAddDelegateTx(data.beneficiary, spendingLimitAddress))
  }

  if (existingSpendingLimit && existingSpendingLimit.spent !== '0') {
    txs.push(createResetAllowanceTx(data.beneficiary, data.tokenAddress, spendingLimitAddress))
  }

  const tx = createSetAllowanceTx(
    data.beneficiary,
    data.tokenAddress,
    parseUnits(data.amount, tokenDecimals ?? undefined).toString(),
    parseInt(data.resetTime),
    data.resetTime !== '0' ? currentMinutes() - 30 : 0,
    spendingLimitAddress,
  )

  txs.push(tx)

  return createMultiSendCallOnlyTx(txs)
}
