import {
  Operation,
  postSafeGasEstimation,
  getNonces as fetchNonces,
  type SafeTransactionEstimation,
} from '@safe-global/safe-gateway-typescript-sdk'
import type { MetaTransactionData, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { Errors, logError } from '@/services/exceptions'
import { isLegacyVersion } from '@safe-global/utils/services/contracts/utils'

const fetchRecommendedParams = async (
  chainId: string,
  safeAddress: string,
  txParams: MetaTransactionData,
): Promise<SafeTransactionEstimation> => {
  return postSafeGasEstimation(chainId, safeAddress, {
    to: txParams.to,
    value: txParams.value,
    data: txParams.data,
    operation: (txParams.operation as unknown as Operation) || Operation.CALL,
  })
}

export const getSafeTxGas = async (
  chainId: string,
  safeAddress: string,
  safeVersion: string,
  safeTxData: SafeTransactionDataPartial,
): Promise<string | undefined> => {
  const isSafeTxGasRequired = isLegacyVersion(safeVersion)

  // For 1.3.0+ Safes safeTxGas is not required
  if (!isSafeTxGasRequired) return '0'

  try {
    const estimation = await fetchRecommendedParams(chainId, safeAddress, safeTxData)
    return estimation.safeTxGas
  } catch (e) {
    logError(Errors._616, e)
  }
}

export const getNonces = async (chainId: string, safeAddress: string) => {
  try {
    return await fetchNonces(chainId, safeAddress)
  } catch (e) {
    logError(Errors._616, e)
  }
}
