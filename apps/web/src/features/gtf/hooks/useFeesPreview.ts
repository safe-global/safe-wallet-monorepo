import { useContext } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useGasLimit from '@/hooks/useGasLimit'
import useGasPrice from '@/hooks/useGasPrice'
import { useCurrentChain } from '@/hooks/useChains'
import { getTotalFeeFormatted } from '@safe-global/utils/hooks/useDefaultGasPrice'

export type FeesPreviewData = {
  gasFee: { label: string; amount: string; currency: string }
  loading?: boolean
  error?: boolean
}

export const useFeesPreview = (): FeesPreviewData => {
  const { safeTx } = useContext(SafeTxContext)
  const { gasLimit, gasLimitError, gasLimitLoading } = useGasLimit(safeTx)
  const [gasPrice, gasPriceError, gasPriceLoading] = useGasPrice()
  const chain = useCurrentChain()

  const loading = gasLimitLoading || gasPriceLoading || !safeTx
  const hasError = !loading && (!!gasLimitError || !!gasPriceError || !gasLimit || !gasPrice?.maxFeePerGas)
  const gasFeeFormatted = getTotalFeeFormatted(gasPrice?.maxFeePerGas, gasLimit, chain)
  const nativeSymbol = chain?.nativeCurrency.symbol ?? 'ETH'

  return {
    gasFee: { label: 'Gas fee', amount: gasFeeFormatted, currency: nativeSymbol },
    loading,
    error: hasError,
  }
}
