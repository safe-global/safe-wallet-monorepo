import { getTotalFee } from '@safe-global/utils/hooks/useDefaultGasPrice'
import useWalletBalance from '@/hooks/wallets/useWalletBalance'

const useWalletCanPay = ({ gasLimit, maxFeePerGas }: { gasLimit?: bigint; maxFeePerGas?: bigint | null }) => {
  const [walletBalance] = useWalletBalance()

  // Take an optimistic approach and assume the wallet can pay
  // if gasLimit, maxFeePerGas or their walletBalance are missing
  if (gasLimit === undefined || maxFeePerGas === undefined || maxFeePerGas === null || walletBalance === undefined)
    return true

  const totalFee = getTotalFee(maxFeePerGas, gasLimit)

  return walletBalance >= totalFee
}

export default useWalletCanPay
