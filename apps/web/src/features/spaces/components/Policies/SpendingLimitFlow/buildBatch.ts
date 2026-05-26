import { Interface, parseUnits } from 'ethers'
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
import { currentMinutes } from '@safe-global/utils/utils/date'

const safeIface = new Interface(['function enableModule(address module)'])

export type Period = 'once' | 'day' | 'week' | 'month'

// The AllowanceModule reads `resetTimeMin = 0` as a one-time allowance: the
// spender can withdraw up to the limit once and the policy is exhausted.
const PERIOD_MIN: Record<Period, number> = {
  once: 0,
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
  safeAddress: string
  safeVersion: string
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
  const { chain, chainId, safeAddress, safeVersion, delegate, amountUsd, period, tokens, safeModules, safeDeployed } =
    input

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
    if (!safeDeployed) {
      // Counterfactual safes need the Safe deployment + module enable bundled
      // through the createEnableModuleTx helper which knows the right
      // contract version.
      const enableTx = await createEnableModuleTx(chain, safeAddress, safeVersion, allowanceModuleAddress)
      txs.push({ to: enableTx.to, value: '0', data: enableTx.data })
    } else {
      // Deployed safe: a plain enableModule(address) call against the Safe.
      // Encoding directly avoids the global Safe SDK singleton — that lets us
      // build the batch for any Safe in the workspace without first switching
      // the app's active-safe context.
      txs.push({
        to: safeAddress,
        value: '0',
        data: safeIface.encodeFunctionData('enableModule', [allowanceModuleAddress]),
      })
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
