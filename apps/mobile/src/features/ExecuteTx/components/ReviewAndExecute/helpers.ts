import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
/**
 * Determines the execution method based on user selection and relay availability
 */
export const getExecutionMethod = (
  requestedMethod: ExecutionMethod | undefined,
  isRelayAvailable: boolean,
): ExecutionMethod => {
  // If user explicitly requested relay but none are available, fallback to signer
  if (requestedMethod === ExecutionMethod.WITH_RELAY && !isRelayAvailable) {
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
