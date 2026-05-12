import { parseUnits } from 'ethers'
import type { MetaTransactionData } from '@safe-global/types-kit'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import {
  createAddDelegateTx,
  createEnableModuleTx,
  createSetAllowanceTx,
} from '@/features/spending-limits/services/spendingLimitParams'
import {
  getDeployedSpendingLimitModuleAddress,
  getLatestSpendingLimitAddress,
} from '@/features/spending-limits/services/spendingLimitContracts'
import { getSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { currentMinutes } from '@safe-global/utils/utils/date'

export type Period = 'day' | 'week' | 'month'

const PERIOD_MIN: Record<Period, number> = {
  day: 1440,
  week: 10080,
  month: 43200,
}

export type BatchToken = {
  address: string
  decimals: number
  fiatConversion?: string
  manualAmount?: number
}

export type BuildBatchInput = {
  chain: Chain
  chainId: string
  delegate: string
  amountUsd: number
  period: Period
  tokens: BatchToken[]
  safeModules: SafeState['modules']
  safeDeployed: boolean
}

export type BuildBatchResult = {
  txs: MetaTransactionData[]
  allowanceModuleAddress: string
}

export const buildSpendingLimitBatch = async (input: BuildBatchInput): Promise<BuildBatchResult> => {
  const { chain, chainId, delegate, amountUsd, period, tokens, safeModules, safeDeployed } = input

  if (tokens.length === 0) {
    throw new Error('Pick at least one token')
  }

  let allowanceModuleAddress = safeDeployed
    ? (getDeployedSpendingLimitModuleAddress(chainId, safeModules) ?? undefined)
    : undefined
  const isModuleEnabled = !!allowanceModuleAddress
  if (!isModuleEnabled) {
    allowanceModuleAddress = getLatestSpendingLimitAddress(chainId)
  }
  if (!allowanceModuleAddress) {
    throw new Error(`Allowance Module is not available on chain ${chainId}`)
  }

  const txs: MetaTransactionData[] = []

  if (!isModuleEnabled) {
    const sdk = getSafeSDK()
    if (!sdk) throw new Error('Safe SDK not initialized')

    if (!safeDeployed) {
      const enableTx = await createEnableModuleTx(
        chain,
        await sdk.getAddress(),
        sdk.getContractVersion(),
        allowanceModuleAddress,
      )
      txs.push({ to: enableTx.to, value: '0', data: enableTx.data })
    } else {
      const enableTx = await sdk.createEnableModuleTx(allowanceModuleAddress)
      txs.push({ to: enableTx.data.to, value: '0', data: enableTx.data.data })
    }
  }

  txs.push(createAddDelegateTx(delegate, allowanceModuleAddress))

  const resetTimeMin = PERIOD_MIN[period]
  const resetBaseMin = currentMinutes() - 30

  for (const token of tokens) {
    let tokenAmount: number
    if (token.manualAmount !== undefined && token.manualAmount > 0) {
      tokenAmount = token.manualAmount
    } else {
      const rate = token.fiatConversion ? Number(token.fiatConversion) : NaN
      if (!Number.isFinite(rate) || rate <= 0) {
        throw new Error(`No amount set for ${token.address}; enter a per-token amount or wait for the live rate`)
      }
      tokenAmount = amountUsd / rate
    }
    const fixed = tokenAmount.toFixed(Math.min(token.decimals, 18))
    const amountWei = parseUnits(fixed, token.decimals).toString()

    txs.push(
      createSetAllowanceTx(delegate, token.address, amountWei, resetTimeMin, resetBaseMin, allowanceModuleAddress),
    )
  }

  return { txs, allowanceModuleAddress }
}
