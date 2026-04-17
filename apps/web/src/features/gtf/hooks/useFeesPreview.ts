import { useContext, useState } from 'react'
import { formatUnits } from 'ethers'
import { skipToken } from '@reduxjs/toolkit/query'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { sameAddress } from '@safe-global/utils/utils/addresses'

import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import useBalances from '@/hooks/useBalances'
import useGasLimit from '@/hooks/useGasLimit'
import useGasPrice from '@/hooks/useGasPrice'
import { useGetGtfFeePreviewQuery } from '@/store/api/gateway'
import { getTotalFeeFormatted } from '@safe-global/utils/hooks/useDefaultGasPrice'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { SafeTransaction } from '@safe-global/types-kit'

export type FeeRow = {
  label: string
  amount?: string
  currency?: string
  fiatAmount?: string
  isFree?: boolean
}

export type TotalOutgoing = {
  primary: { amount: string; currency: string }
  fees?: { amount: string; currency: string }
  fiatTotal: string
}

export type FeesPreviewData = {
  canCoverFees: boolean
  /** When true, fees are already locked in (not the first signer) — no selectors shown */
  isConfirmation?: boolean
  executionFee: FeeRow
  gasFee: FeeRow
  totalOutgoing?: TotalOutgoing
  availableGasTokens?: Array<{ symbol: string; logoUri: string; fiatBalance?: string }>
  selectedGasToken?: string
  onGasTokenChange?: (symbol: string) => void
  loading?: boolean
  error?: boolean
}

const ERC20_INTERFACE = ERC20__factory.createInterface()
const TRANSFER_SELECTOR = ERC20_INTERFACE.getFunction('transfer').selector
const EXECUTION_FEE: FeeRow = { label: 'Execution fee', isFree: true }

type TotalOutgoingInputs = {
  safeTx: SafeTransaction
  gasWei: bigint
  relayCostUsd: number
  nativeSymbol: string
  nativeDecimals: number
  balances: Balances
}

const computeTotalOutgoing = ({
  safeTx,
  gasWei,
  relayCostUsd,
  nativeSymbol,
  nativeDecimals,
  balances,
}: TotalOutgoingInputs): TotalOutgoing | undefined => {
  const { to, value, data } = safeTx.data
  const isEmptyData = !data || data === '0x'

  // Native transfer — send token = gas token (native). Single currency.
  if (value !== '0' && isEmptyData) {
    const sendWei = BigInt(value)
    const primaryAmount = formatUnits(sendWei + gasWei, nativeDecimals)
    const nativeToken = balances.items.find((b) => b.tokenInfo.type === 'NATIVE_TOKEN')
    const sendFiat = nativeToken ? Number(formatUnits(sendWei, nativeDecimals)) * Number(nativeToken.fiatConversion) : 0
    return {
      primary: { amount: primaryAmount, currency: nativeSymbol },
      fiatTotal: formatCurrency(sendFiat + relayCostUsd, 'usd'),
    }
  }

  // ERC-20 transfer — send token ≠ gas token. Two currencies.
  if (data?.startsWith(TRANSFER_SELECTOR)) {
    try {
      const decoded = ERC20_INTERFACE.decodeFunctionData('transfer', data)
      const transferValue = decoded[1] as bigint
      const token = balances.items.find((b) => sameAddress(b.tokenInfo.address, to))
      if (!token || token.tokenInfo.type !== 'ERC20') return undefined

      const sendAmount = formatUnits(transferValue, token.tokenInfo.decimals)
      const sendFiat = Number(sendAmount) * Number(token.fiatConversion)
      const gasAmount = formatUnits(gasWei, nativeDecimals)
      return {
        primary: { amount: sendAmount, currency: token.tokenInfo.symbol },
        fees: { amount: gasAmount, currency: nativeSymbol },
        fiatTotal: formatCurrency(sendFiat + relayCostUsd, 'usd'),
      }
    } catch {
      return undefined
    }
  }

  return undefined
}

export const useFeesPreview = (): FeesPreviewData => {
  const { safeTx } = useContext(SafeTxContext)
  const { safe, safeAddress } = useSafeInfo()
  const chain = useCurrentChain()
  const { balances } = useBalances()
  const [selectedGasToken, setSelectedGasToken] = useState<string>('')

  const nativeSymbol = chain?.nativeCurrency.symbol ?? 'ETH'
  const nativeLogoUri = chain?.nativeCurrency.logoUri ?? ''
  const nativeDecimals = chain?.nativeCurrency.decimals ?? 18
  const effectiveGasToken = selectedGasToken || nativeSymbol
  const availableGasTokens = [{ symbol: nativeSymbol, logoUri: nativeLogoUri }]

  const preview = useGetGtfFeePreviewQuery(
    safeTx && chain?.chainId && safeAddress && safe.threshold > 0
      ? {
          chainId: chain.chainId,
          safeAddress,
          tx: {
            to: safeTx.data.to,
            value: safeTx.data.value,
            data: safeTx.data.data,
            operation: safeTx.data.operation,
            gasToken: ZERO_ADDRESS,
            numberSignatures: safe.threshold,
          },
        }
      : skipToken,
  )

  // Fallback local estimation — drives the gas fee shown in the EOA fallback variant.
  const { gasLimit, gasLimitError, gasLimitLoading } = useGasLimit(safeTx)
  const [gasPrice, gasPriceError, gasPriceLoading] = useGasPrice()

  const base = {
    executionFee: EXECUTION_FEE,
    availableGasTokens,
    selectedGasToken: effectiveGasToken,
    onGasTokenChange: setSelectedGasToken,
  }

  // Pending first — guards against rendering stale `preview.data` against a freshly-edited
  // `safeTx` while a refetch is in flight (RTK Query retains `data` during refetches).
  if (preview.isLoading || preview.isFetching) {
    return {
      ...base,
      canCoverFees: true,
      gasFee: { label: 'Gas fee', currency: nativeSymbol },
      loading: true,
      error: false,
    }
  }

  // Happy path — fresh, error-free response.
  if (preview.data && !preview.error && safeTx) {
    const { txData, relayCostUsd } = preview.data
    const gasWei = (BigInt(txData.safeTxGas) + BigInt(txData.baseGas)) * BigInt(txData.gasPrice)
    const gasAmount = formatUnits(gasWei, nativeDecimals)
    const totalOutgoing = computeTotalOutgoing({
      safeTx,
      gasWei,
      relayCostUsd,
      nativeSymbol,
      nativeDecimals,
      balances,
    })

    return {
      ...base,
      canCoverFees: true,
      gasFee: {
        label: 'Gas fee',
        amount: gasAmount,
        currency: nativeSymbol,
        fiatAmount: formatCurrency(relayCostUsd, 'usd'),
      },
      totalOutgoing,
      loading: false,
      error: false,
    }
  }

  // Fallback — endpoint errored or not queryable. Use local estimation for the EOA-paid gas fee.
  const fallbackLoading = !safeTx || gasLimitLoading || gasPriceLoading
  const fallbackError = !fallbackLoading && (!!gasLimitError || !!gasPriceError || !gasLimit || !gasPrice?.maxFeePerGas)
  const fallbackAmount = getTotalFeeFormatted(gasPrice?.maxFeePerGas, gasLimit, chain)

  return {
    ...base,
    canCoverFees: false,
    gasFee: {
      label: 'Gas fee',
      amount: fallbackAmount,
      currency: nativeSymbol,
    },
    loading: fallbackLoading,
    error: fallbackError,
  }
}
