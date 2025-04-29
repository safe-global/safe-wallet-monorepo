import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { type FeeData } from 'ethers'
import type {
  ChainInfo,
  GasPrice,
  GasPriceFixed,
  GasPriceFixedEIP1559,
  GasPriceOracle,
} from '@safe-global/safe-gateway-typescript-sdk'
import { GAS_PRICE_TYPE } from '@safe-global/safe-gateway-typescript-sdk'
import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useCurrentChain } from './useChains'
import useIntervalCounter from './useIntervalCounter'
import { useWeb3ReadOnly } from '../hooks/wallets/web3'
import { Errors, logError } from '@/services/exceptions'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

type EstimatedGasPrice =
  | {
      gasPrice: bigint
    }
  | {
      maxFeePerGas: bigint
      maxPriorityFeePerGas: bigint
    }

type GasFeeParams = {
  maxFeePerGas: bigint | null | undefined
  maxPriorityFeePerGas: bigint | null | undefined
}

// Update gas fees every 20 seconds
const REFRESH_DELAY = 20e3

type EtherscanResult = {
  LastBlock: string
  SafeGasPrice: string
  ProposeGasPrice: string
  FastGasPrice: string
  suggestBaseFee: string
  gasUsedRatio: string
}

const isEtherscanResult = (data: any): data is EtherscanResult => {
  return 'FastGasPrice' in data && 'suggestBaseFee' in data
}

/**
 * Parses result from etherscan oracle.
 * Since EIP 1559 it returns the `maxFeePerGas` as gas price and the current network baseFee as `suggestedBaseFee`.
 * The `maxPriorityFeePerGas` can then be computed as `maxFeePerGas` - `suggestedBaseFee`
 *
 * @param result {@link EtherscanResult}
 * @see https://docs.etherscan.io/api-endpoints/gas-tracker
 */
const parseEtherscanOracleResult = (result: EtherscanResult, gweiFactor: string): EstimatedGasPrice => {
  const maxFeePerGas = BigInt(Number(result.FastGasPrice) * Number(gweiFactor))
  const baseFee = BigInt(Number(result.suggestBaseFee) * Number(gweiFactor))

  return {
    maxFeePerGas,
    maxPriorityFeePerGas: maxFeePerGas - baseFee,
  }
}

// Loop over the oracles and return the first one that works.
// Or return a fixed value if specified.
// If none of them work, throw an error.
const fetchGasOracle = async (gasPriceOracle: GasPriceOracle): Promise<EstimatedGasPrice> => {
  const { uri, gasParameter, gweiFactor } = gasPriceOracle
  const response = await fetch(uri)
  if (!response.ok) {
    throw new Error(`Error fetching gas price from oracle ${uri}`)
  }

  const json = await response.json()
  const data = json.data || json.result || json

  if (isEtherscanResult(data)) {
    return parseEtherscanOracleResult(data, gweiFactor)
  }
  return { gasPrice: BigInt(data[gasParameter] * Number(gweiFactor)) }
}

// These typeguards are necessary because the GAS_PRICE_TYPE enum uses uppercase while the config service uses lowercase values
const isGasPriceFixed = (gasPriceConfig: GasPrice[number]): gasPriceConfig is GasPriceFixed => {
  return gasPriceConfig.type.toUpperCase() == GAS_PRICE_TYPE.FIXED
}

const isGasPriceFixed1559 = (gasPriceConfig: GasPrice[number]): gasPriceConfig is GasPriceFixedEIP1559 => {
  return gasPriceConfig.type.toUpperCase() == GAS_PRICE_TYPE.FIXED_1559
}

const isGasPriceOracle = (gasPriceConfig: GasPrice[number]): gasPriceConfig is GasPriceOracle => {
  return gasPriceConfig.type.toUpperCase() == GAS_PRICE_TYPE.ORACLE
}

const getGasPrice = async (gasPriceConfigs: GasPrice): Promise<EstimatedGasPrice | undefined> => {
  let error: Error | undefined
  for (const config of gasPriceConfigs) {
    if (isGasPriceFixed(config)) {
      return {
        gasPrice: BigInt(config.weiValue),
      }
    }

    if (isGasPriceFixed1559(config)) {
      return {
        maxFeePerGas: BigInt(config.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(config.maxPriorityFeePerGas),
      }
    }

    if (isGasPriceOracle(config)) {
      try {
        return await fetchGasOracle(config)
      } catch (_err) {
        error = asError(_err)
        logError(Errors._611, error.message)
        // Continue to the next oracle
        continue
      }
    }
  }

  // If everything failed, throw the last error or return undefined
  if (error) {
    throw error
  }
}

const getGasParameters = (
  estimation: EstimatedGasPrice | undefined,
  feeData: FeeData | undefined,
  isEIP1559: boolean,
): GasFeeParams => {
  if (!estimation) {
    return {
      maxFeePerGas: isEIP1559 ? feeData?.maxFeePerGas : feeData?.gasPrice,
      maxPriorityFeePerGas: isEIP1559 ? feeData?.maxPriorityFeePerGas : undefined,
    }
  }

  if (isEIP1559 && 'maxFeePerGas' in estimation && 'maxPriorityFeePerGas' in estimation) {
    return estimation
  }

  if ('gasPrice' in estimation) {
    return {
      maxFeePerGas: estimation.gasPrice,
      maxPriorityFeePerGas: isEIP1559 ? feeData?.maxPriorityFeePerGas : undefined,
    }
  }

  return {
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
  }
}

export const getTotalFee = (maxFeePerGas: bigint, gasLimit: bigint | string | number) => {
  return maxFeePerGas * BigInt(gasLimit)
}

export const getTotalFeeFormatted = (
  maxFeePerGas: bigint | null | undefined,
  gasLimit: bigint | undefined,
  chain: ChainInfo | undefined,
) => {
  return gasLimit && maxFeePerGas
    ? formatVisualAmount(getTotalFee(maxFeePerGas, gasLimit), chain?.nativeCurrency.decimals)
    : '> 0.001'
}

const SPEED_UP_MAX_PRIO_FACTOR = 2n

const SPEED_UP_GAS_PRICE_FACTOR = 150n

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
        // Fetch gas price from oracles or get a fixed value
        gasPriceConfigs ? getGasPrice(gasPriceConfigs) : undefined,

        // Fetch the gas fees from the blockchain itself
        provider?.getFeeData(),
      ])

      // Prepare the return values
      const gasParameters = getGasParameters(gasEstimation, feeData, isEIP1559)

      if (!isSpeedUp) {
        return gasParameters
      }

      if (isEIP1559 && gasParameters.maxFeePerGas && gasParameters.maxPriorityFeePerGas) {
        return {
          maxFeePerGas:
            gasParameters.maxFeePerGas +
            (gasParameters.maxPriorityFeePerGas * SPEED_UP_MAX_PRIO_FACTOR - gasParameters.maxPriorityFeePerGas),
          maxPriorityFeePerGas: gasParameters.maxPriorityFeePerGas * SPEED_UP_MAX_PRIO_FACTOR,
        }
      }

      return {
        maxFeePerGas: gasParameters.maxFeePerGas
          ? (gasParameters.maxFeePerGas * SPEED_UP_GAS_PRICE_FACTOR) / 100n
          : undefined,
        maxPriorityFeePerGas: undefined,
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gasPriceConfigs, provider, counter, isEIP1559],
    false,
  )

  const isLoading = gasPriceLoading || (!gasPrice && !gasPriceError)

  return [gasPrice, gasPriceError, isLoading]
}

export default useGasPrice
