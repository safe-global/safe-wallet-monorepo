import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FeeParams } from '@/src/hooks/useFeeParams/useFeeParams'
import { Signer } from '@/src/store/signersSlice'

/**
 * Execution path types for the confirm flow
 */
export type ExecutionPath = 'ledger' | 'biometrics' | 'standard'

/**
 * Determines the execution method based on user selection, relay availability, and signer type
 */
export const getExecutionMethod = (
  requestedMethod: ExecutionMethod,
  isRelayAvailable: boolean,
  chain: Chain,
  signer?: Signer,
): ExecutionMethod => {
  // Relay takes priority if requested and available
  const isRelayEnabled = !!chain && hasFeature(chain, FEATURES.RELAYING)
  if (requestedMethod === ExecutionMethod.WITH_RELAY && isRelayAvailable && isRelayEnabled) {
    return ExecutionMethod.WITH_RELAY
  }

  // Ledger signer uses Ledger execution
  if (signer?.type === 'ledger') {
    return ExecutionMethod.WITH_LEDGER
  }

  // Default to private key execution
  return ExecutionMethod.WITH_PK
}

/**
 * Gets the submit button text based on funds availability
 */
export const getSubmitButtonText = (hasSufficientFunds: boolean) => {
  if (!hasSufficientFunds) {
    return 'Insufficient funds'
  }

  return 'Execute transaction'
}

/**
 * Builds route parameters from fee params for navigation
 */
export const buildRouteParams = (txId: string, executionMethod: ExecutionMethod, feeParams: FeeParams) => ({
  txId,
  executionMethod,
  maxFeePerGas: feeParams.maxFeePerGas?.toString(),
  maxPriorityFeePerGas: feeParams.maxPriorityFeePerGas?.toString(),
  gasLimit: feeParams.gasLimit?.toString(),
  nonce: feeParams.nonce?.toString(),
})

/**
 * Determines which execution path to use based on signer type and biometrics
 */
export const determineExecutionPath = (
  activeSigner: Signer | undefined,
  isBiometricsEnabled: boolean,
): ExecutionPath => {
  if (activeSigner?.type === 'ledger') {
    return 'ledger'
  }

  if (!isBiometricsEnabled) {
    return 'biometrics'
  }

  return 'standard'
}

/**
 * Extracts error message from unknown error
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  return 'Failed to execute transaction'
}
