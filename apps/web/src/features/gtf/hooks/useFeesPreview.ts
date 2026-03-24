import { useContext } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useGasLimit from '@/hooks/useGasLimit'
import useGasPrice from '@/hooks/useGasPrice'
import { useCurrentChain } from '@/hooks/useChains'
import { getTotalFeeFormatted } from '@safe-global/utils/hooks/useDefaultGasPrice'

export type FeesPreviewData = {
  executionFee: { label: string }
  gasFee: { label: string; amount: string; currency: string }
  loading?: boolean
}

export const useFeesPreview = (): FeesPreviewData => {
  const { safeTx } = useContext(SafeTxContext)
  const { gasLimit, gasLimitLoading } = useGasLimit(safeTx)
  const [gasPrice, , gasPriceLoading] = useGasPrice()
  const chain = useCurrentChain()

  const loading = gasLimitLoading || gasPriceLoading || !safeTx
  const gasFeeFormatted = getTotalFeeFormatted(gasPrice?.maxFeePerGas, gasLimit, chain)
  const nativeSymbol = chain?.nativeCurrency.symbol ?? 'ETH'

  return {
    executionFee: { label: 'Execution fee' },
    gasFee: { label: 'Gas fee', amount: gasFeeFormatted, currency: nativeSymbol },
    loading,
  }
}
