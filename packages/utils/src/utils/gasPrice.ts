import { formatVisualAmount } from './formatters'
import type { FeeData } from 'ethers'
import type {
  ChainInfo,
  GasPrice,
  GasPriceFixed,
  GasPriceFixedEIP1559,
  GasPriceOracle,
} from '@safe-global/safe-gateway-typescript-sdk'
import { GAS_PRICE_TYPE } from '@safe-global/safe-gateway-typescript-sdk'
import { asError } from '../services/exceptions/utils'

export type EstimatedGasPrice =
  | {
      gasPrice: bigint
    }
  | {
      maxFeePerGas: bigint
      maxPriorityFeePerGas: bigint
    }

export type GasFeeParams = {
  maxFeePerGas: bigint | null | undefined
  maxPriorityFeePerGas: bigint | null | undefined
}

type EtherscanResult = {
  LastBlock: string
  SafeGasPrice: string
  ProposeGasPrice: string
  FastGasPrice: string
  suggestBaseFee: string
  gasUsedRatio: string
}

const isEtherscanResult = (data: unknown): data is EtherscanResult => {
  return typeof data === 'object' && data !== null && 'FastGasPrice' in data && 'suggestBaseFee' in data
}

/**
 * Parses result from etherscan oracle.
 * Since EIP 1559 it returns the `maxFeePerGas` as gas price and the current network baseFee as `suggestedBaseFee`.
 * The `maxPriorityFeePerGas` can then be computed as `maxFeePerGas` - `suggestedBaseFee`
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
export const fetchGasOracle = async (gasPriceOracle: GasPriceOracle): Promise<EstimatedGasPrice> => {
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

const isGasPriceFixed = (gasPriceConfig: GasPrice[number]): gasPriceConfig is GasPriceFixed => {
  return gasPriceConfig.type.toUpperCase() === GAS_PRICE_TYPE.FIXED
}

const isGasPriceFixed1559 = (gasPriceConfig: GasPrice[number]): gasPriceConfig is GasPriceFixedEIP1559 => {
  return gasPriceConfig.type.toUpperCase() === GAS_PRICE_TYPE.FIXED_1559
}

const isGasPriceOracle = (gasPriceConfig: GasPrice[number]): gasPriceConfig is GasPriceOracle => {
  return gasPriceConfig.type.toUpperCase() === GAS_PRICE_TYPE.ORACLE
}

export const estimateGasPriceFromConfigs = async (
  gasPriceConfigs: GasPrice,
  onError?: (error: Error) => void,
): Promise<EstimatedGasPrice | undefined> => {
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
        onError?.(error)
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

export const getGasParameters = (
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

export const SPEED_UP_MAX_PRIORITY_FACTOR = 2n
export const SPEED_UP_GAS_PRICE_FACTOR = 150n

export const applySpeedUpGasParameters = (gasParameters: GasFeeParams, isEIP1559: boolean): GasFeeParams => {
  if (isEIP1559 && gasParameters.maxFeePerGas && gasParameters.maxPriorityFeePerGas) {
    return {
      maxFeePerGas:
        gasParameters.maxFeePerGas +
        (gasParameters.maxPriorityFeePerGas * SPEED_UP_MAX_PRIORITY_FACTOR - gasParameters.maxPriorityFeePerGas),
      maxPriorityFeePerGas: gasParameters.maxPriorityFeePerGas * SPEED_UP_MAX_PRIORITY_FACTOR,
    }
  }

  return {
    maxFeePerGas: gasParameters.maxFeePerGas
      ? (gasParameters.maxFeePerGas * SPEED_UP_GAS_PRICE_FACTOR) / 100n
      : undefined,
    maxPriorityFeePerGas: undefined,
  }
}

export const getTotalFee = (maxFeePerGas: bigint, gasLimit: bigint | string | number): bigint => {
  return maxFeePerGas * BigInt(gasLimit)
}

export const getTotalFeeFormatted = (
  maxFeePerGas: bigint | null | undefined,
  gasLimit: bigint | undefined,
  chain: ChainInfo | undefined,
): string => {
  return gasLimit && maxFeePerGas
    ? formatVisualAmount(getTotalFee(maxFeePerGas, gasLimit), chain?.nativeCurrency.decimals)
    : '> 0.001'
}
