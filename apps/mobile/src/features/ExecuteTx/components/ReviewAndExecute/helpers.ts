import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
/**
 * Determines the execution method based on user selection and relay availability
 */
export const getExecutionMethod = (
  requestedMethod: ExecutionMethod | undefined,
  isRelayAvailable: boolean,
  chain: Chain,
): ExecutionMethod => {
  const canNotUseRelayOption = requestedMethod === ExecutionMethod.WITH_RELAY && !isRelayAvailable
  const isRelayEnabled = chain && hasFeature(chain, FEATURES.RELAYING)

  // If user explicitly requested relay but none are available, fallback to signer
  if (canNotUseRelayOption || !isRelayEnabled) {
    return ExecutionMethod.WITH_PK
  }

  // If user selected a method, use it
  if (requestedMethod) {
    return requestedMethod
  }

  // Default: use relay if available, otherwise use signer
  return isRelayAvailable ? ExecutionMethod.WITH_RELAY : ExecutionMethod.WITH_PK
}

export const getSubmitButtonText = (hasSufficientFunds: boolean, willFail: boolean) => {
  if (willFail) {
    return 'This transaction will most likely fail'
  }

  if (!hasSufficientFunds) {
    return 'Insufficient funds'
  }

  return 'Execute transaction'
}
