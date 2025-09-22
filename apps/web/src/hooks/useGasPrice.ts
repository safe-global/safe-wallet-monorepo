import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useCurrentChain } from './useChains'
import useIntervalCounter from './useIntervalCounter'
import { useWeb3ReadOnly } from '../hooks/wallets/web3'
import { Errors, logError } from '@/services/exceptions'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import {
  estimateGasPriceFromConfigs,
  getGasParameters,
  applySpeedUpGasParameters,
  type GasFeeParams,
} from '@safe-global/utils/utils/gasPrice'

// Update gas fees every 20 seconds
const REFRESH_DELAY = 20e3

/**
 * Estimates the gas price through the configured methods:
 * - Oracle
 * - Fixed gas prices
 * - Or using ethers' getFeeData
 *
 * @param isSpeedUp if true, increases the returned gas parameters
 * @returns [gasPrice, error, loading]
 */
const useGasPrice = (isSpeedUp: boolean = false): AsyncResult<GasFeeParams> => {
  const chain = useCurrentChain()
  const gasPriceConfigs = chain?.gasPrice
  const [counter] = useIntervalCounter(REFRESH_DELAY)
  const provider = useWeb3ReadOnly()
  const isEIP1559 = !!chain && hasFeature(chain, FEATURES.EIP1559)

  const [gasPrice, gasPriceError, gasPriceLoading] = useAsync(
    async () => {
      const [gasEstimation, feeData] = await Promise.all([
        gasPriceConfigs
          ? estimateGasPriceFromConfigs(gasPriceConfigs, (error) => logError(Errors._611, error.message))
          : undefined,
        provider?.getFeeData(),
      ])

      const gasParameters = getGasParameters(gasEstimation, feeData, isEIP1559)

      return isSpeedUp ? applySpeedUpGasParameters(gasParameters, isEIP1559) : gasParameters
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gasPriceConfigs, provider, counter, isEIP1559],
    false,
  )

  const isLoading = gasPriceLoading || (!gasPrice && !gasPriceError)

  return [gasPrice, gasPriceError, isLoading]
}

export default useGasPrice
