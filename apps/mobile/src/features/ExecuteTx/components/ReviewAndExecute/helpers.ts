import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
/**
 * Determines the execution method based on user selection and relay availability
 */
export const getExecutionMethod = (
  requestedMethod: ExecutionMethod,
  isRelayAvailable: boolean,
  chain: Chain,
): ExecutionMethod => {
  const canNotUseRelayOption = requestedMethod === ExecutionMethod.WITH_RELAY && !isRelayAvailable
  const isRelayEnabled = chain && hasFeature(chain, FEATURES.RELAYING)

  // If user explicitly requested relay but none are available or relay is not enabled, fallback to signer
  if (canNotUseRelayOption || !isRelayEnabled) {
    return ExecutionMethod.WITH_PK
  }

  // Return the requested method
  return requestedMethod
}

export const getSubmitButtonText = (hasSufficientFunds: boolean) => {
  if (!hasSufficientFunds) {
    return 'Insufficient funds'
  }

  return 'Execute transaction'
}
