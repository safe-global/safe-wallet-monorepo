import { getTotalFee } from './useDefaultGasPrice';

interface UseSignerCanPayProps {
  gasLimit?: bigint
  maxFeePerGas?: bigint | null
  balance: bigint
}

const useWalletCanPay = ({ gasLimit, maxFeePerGas, balance }: UseSignerCanPayProps) => {
  // Take an optimistic approach and assume the wallet can pay
  // if gasLimit, maxFeePerGas or their walletBalance are missing
  if (gasLimit === undefined || maxFeePerGas === undefined || maxFeePerGas === null || balance === undefined)
    return true

  const totalFee = getTotalFee(maxFeePerGas, gasLimit)

  return balance >= totalFee
}

export default useWalletCanPay
