import { getTotalFee } from './useDefaultGasPrice'

interface UseSignerCanPayProps {
  gasLimit?: bigint
  maxFeePerGas?: bigint | null
  balance: bigint
}

const useSignerCanPay = ({ gasLimit, maxFeePerGas, balance }: UseSignerCanPayProps) => {
  // Take an optimistic approach and assume the signer can pay
  // if gasLimit, maxFeePerGas or their balance are missing
  if (gasLimit === undefined || maxFeePerGas === undefined || maxFeePerGas === null || balance === undefined)
    return true

  const totalFee = getTotalFee(maxFeePerGas, gasLimit)

  return balance >= totalFee
}

export default useSignerCanPay
