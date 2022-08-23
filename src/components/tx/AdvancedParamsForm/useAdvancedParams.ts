import { useState } from 'react'
import { AdvancedParameters } from '@/components/tx/AdvancedParamsForm/index'
import useGasPrice from '@/hooks/useGasPrice'

const useAdvancedParams = ({ nonce, gasLimit, safeTxGas }: AdvancedParameters) => {
  const [manualParams, setManualParams] = useState<AdvancedParameters>()

  const { maxFeePerGas, maxPriorityFeePerGas } = useGasPrice()

  const advancedParams: AdvancedParameters = {
    nonce: manualParams?.nonce || nonce,
    gasLimit: manualParams?.gasLimit || gasLimit,
    maxFeePerGas: manualParams?.maxFeePerGas || maxFeePerGas,
    maxPriorityFeePerGas: manualParams?.maxPriorityFeePerGas || maxPriorityFeePerGas,
    safeTxGas: manualParams?.safeTxGas || safeTxGas,
  }

  return { advancedParams, setManualParams }
}

export default useAdvancedParams
