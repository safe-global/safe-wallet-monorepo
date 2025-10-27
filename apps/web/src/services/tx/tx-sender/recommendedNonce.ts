import type { EstimationResponse } from '@safe-global/store/gateway/AUTO_GENERATED/estimations'
import { Operation } from '@safe-global/store/gateway/types'
import type { MetaTransactionData, SafeTransactionDataPartial } from '@safe-global/types-kit'
import { Errors, logError } from '@/services/exceptions'
import { isLegacyVersion } from '@safe-global/utils/services/contracts/utils'
import { postSafeGasEstimation, getNonces as fetchNonces } from '@/utils/transactions'

const fetchRecommendedParams = async (
  chainId: string,
  safeAddress: string,
  txParams: MetaTransactionData,
): Promise<EstimationResponse> => {
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
