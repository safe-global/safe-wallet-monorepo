import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'
import { getTotalFee } from '@safe-global/utils/hooks/useDefaultGasPrice'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { EstimatedFeeValues } from '@/src/store/estimatedFeeSlice'
import { useFeeParams, UseFeeParamsSettings } from '@/src/hooks/useFeeParams/useFeeParams'

const useGasFee = (
  txDetails: TransactionDetails,
  manualParams: EstimatedFeeValues | null,
  settings?: UseFeeParamsSettings,
) => {
  const chain = useAppSelector(selectActiveChain)
  const estimatedFeeParams = useFeeParams(txDetails, manualParams, settings)

  const totalFee =
    estimatedFeeParams.isLoadingGasPrice || estimatedFeeParams.gasLimitLoading
      ? 'loading...'
      : formatVisualAmount(
          getTotalFee(estimatedFeeParams.maxFeePerGas ?? 0n, estimatedFeeParams.gasLimit ?? 0n),
          chain?.nativeCurrency.decimals,
        )

  return { totalFee, estimatedFeeParams }
}

export default useGasFee
