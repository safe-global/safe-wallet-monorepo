import { useMemo, useState } from 'react'
import useGasPrice from '@/hooks/useGasPrice'
import { type AdvancedParameters } from '@safe-global/views/components/tx/AdvancedParams/types'
import useUserNonce from './useUserNonce'

/** The execution parameters: the live estimate with the user's edits, the setter (undefined drops the edits), and the estimate alone. */
export const useAdvancedParams = (
  gasLimit?: AdvancedParameters['gasLimit'],
): [AdvancedParameters, (params?: AdvancedParameters) => void, AdvancedParameters] => {
  const [manualParams, setManualParams] = useState<AdvancedParameters>()
  const [gasPrice] = useGasPrice()
  const userNonce = useUserNonce()

  const estimate: AdvancedParameters = useMemo(
    () => ({
      userNonce,
      gasLimit,
      maxFeePerGas: gasPrice?.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice?.maxPriorityFeePerGas,
    }),
    [userNonce, gasLimit, gasPrice?.maxFeePerGas, gasPrice?.maxPriorityFeePerGas],
  )

  const advancedParams: AdvancedParameters = useMemo(
    () => ({
      userNonce: manualParams?.userNonce ?? estimate.userNonce,
      gasLimit: manualParams?.gasLimit ?? estimate.gasLimit,
      maxFeePerGas: manualParams?.maxFeePerGas ?? estimate.maxFeePerGas,
      maxPriorityFeePerGas: manualParams?.maxPriorityFeePerGas ?? estimate.maxPriorityFeePerGas,
    }),
    [manualParams, estimate],
  )

  return [advancedParams, setManualParams, estimate]
}
