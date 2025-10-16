import { EstimatedFeeValues } from '@/src/store/estimatedFeeSlice'

/**
 * Converts string fee parameters from route params to typed EstimatedFeeValues
 * @param params Object containing fee parameters as strings
 * @returns EstimatedFeeValues object with proper types (bigint/number) or null if params are incomplete
 */
export const parseFeeParams = (params: {
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  gasLimit?: string
  nonce?: string
}): EstimatedFeeValues | null => {
  const { maxFeePerGas, maxPriorityFeePerGas, gasLimit, nonce } = params

  if (maxFeePerGas && maxPriorityFeePerGas && gasLimit && nonce) {
    return {
      maxFeePerGas: BigInt(maxFeePerGas),
      maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
      gasLimit: BigInt(gasLimit),
      nonce: parseInt(nonce, 10),
    }
  }

  return null
}
