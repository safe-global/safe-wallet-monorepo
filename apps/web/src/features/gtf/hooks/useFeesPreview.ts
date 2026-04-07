import { useContext, useState } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useGasLimit from '@/hooks/useGasLimit'
import useGasPrice from '@/hooks/useGasPrice'
import { useCurrentChain } from '@/hooks/useChains'
import { getTotalFeeFormatted } from '@safe-global/utils/hooks/useDefaultGasPrice'

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

export const useFeesPreview = (): FeesPreviewData => {
  const { safeTx } = useContext(SafeTxContext)
  const { gasLimit, gasLimitError, gasLimitLoading } = useGasLimit(safeTx)
  const [gasPrice, gasPriceError, gasPriceLoading] = useGasPrice()
  const chain = useCurrentChain()
  const [selectedGasToken, setSelectedGasToken] = useState<string>('')

  const loading = gasLimitLoading || gasPriceLoading || !safeTx
  const hasError = !loading && (!!gasLimitError || !!gasPriceError || !gasLimit || !gasPrice?.maxFeePerGas)
  const gasFeeFormatted = getTotalFeeFormatted(gasPrice?.maxFeePerGas, gasLimit, chain)
  const nativeSymbol = chain?.nativeCurrency.symbol ?? 'ETH'
  const nativeLogoUri = chain?.nativeCurrency.logoUri ?? ''

  // Initialize selected gas token to native on first load
  const effectiveGasToken = selectedGasToken || nativeSymbol

  return {
    canCoverFees: true, // mock: always true until CGW preview endpoint is available
    executionFee: {
      label: 'Execution fee (0.05%)',
      amount: '0.02733',
      currency: nativeSymbol,
      isFree: true,
    },
    gasFee: {
      label: 'Gas fee',
      amount: gasFeeFormatted,
      currency: nativeSymbol,
      fiatAmount: '$3.50', // mock fiat
    },
    totalOutgoing: {
      primary: { amount: '0.5466', currency: nativeSymbol },
      fiatTotal: '$1,068.00',
    },
    availableGasTokens: [{ symbol: nativeSymbol, logoUri: nativeLogoUri, fiatBalance: '$2.57K' }],
    selectedGasToken: effectiveGasToken,
    onGasTokenChange: setSelectedGasToken,
    loading,
    error: hasError,
  }
}
