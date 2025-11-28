import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'
import { getTotalFee } from '@safe-global/utils/hooks/useDefaultGasPrice'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { EstimatedFeeValues } from '@/src/store/estimatedFeeSlice'
import { useFeeParams, UseFeeParamsSettings } from '@/src/hooks/useFeeParams/useFeeParams'

const useGasFee = (
  txDetails: TransactionDetails | undefined,
  manualParams: EstimatedFeeValues | null,
  settings?: UseFeeParamsSettings,
) => {
  const chain = useAppSelector(selectActiveChain)
  const estimatedFeeParams = useFeeParams(txDetails, manualParams, settings)

  const totalFeeRaw = getTotalFee(estimatedFeeParams.maxFeePerGas ?? 0n, estimatedFeeParams.gasLimit ?? 0n)
  const totalFee =
    estimatedFeeParams.isLoadingGasPrice || estimatedFeeParams.gasLimitLoading
      ? 'loading...'
      : formatVisualAmount(totalFeeRaw, chain?.nativeCurrency.decimals)

  return {
    totalFee,
    totalFeeRaw,
    totalFeeEth: formatVisualAmount(totalFeeRaw, chain?.nativeCurrency.decimals, chain?.nativeCurrency.decimals),
    estimatedFeeParams,
  }
}

export default useGasFee
