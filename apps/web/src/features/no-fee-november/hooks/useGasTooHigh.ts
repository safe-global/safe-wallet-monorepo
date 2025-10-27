import useGasPrice from '@/hooks/useGasPrice'
import useGasLimit from '@/hooks/useGasLimit'
import useLoadBalances from '@/hooks/loadables/useLoadBalances'
import { formatUnits } from 'ethers'
import { MAX_SPONSORED_GAS_COST_USD } from '../constants'
import type { SafeTransaction } from '@safe-global/types-kit'
import { TokenType } from '@safe-global/store/gateway/types'

const useGasTooHigh = (safeTx?: SafeTransaction): boolean => {
  const [gasPrice] = useGasPrice()
  const { gasLimit } = useGasLimit(safeTx)
  const [balances] = useLoadBalances()

  // Get ETH price in USD from balances API
  const nativeTokenPrice = balances?.items.find(
    (item) => item.tokenInfo.type === TokenType.NATIVE_TOKEN,
  )?.fiatConversion

  // Calculate total gas cost in wei
  const totalGasCostWei =
    gasLimit && gasPrice?.maxFeePerGas ? BigInt(gasLimit) * BigInt(gasPrice.maxFeePerGas) : undefined

  // Convert to USD
  const gasCostUSD =
    totalGasCostWei && nativeTokenPrice
      ? Number(formatUnits(totalGasCostWei, 18)) * Number(nativeTokenPrice)
      : undefined

  return gasCostUSD ? gasCostUSD > MAX_SPONSORED_GAS_COST_USD : false
}

export default useGasTooHigh
