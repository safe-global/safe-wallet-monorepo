import { DdRum, ErrorSource } from 'expo-datadog'
import {
  matchUserOutcome,
  normalizeError,
  sanitizeErrorMessage,
} from '@safe-global/utils/services/exceptions/normalizeError'
import { BiometryInvalidationError } from '@/src/services/key-storage/errors'
import type { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { PrivateKeyUnavailableError } from './errors'

// 804 is the web's "Error executing a transaction" code; reusing it keeps one error taxonomy across both apps.
const TX_EXECUTION_ERROR_CODE = 804

// Thrown before signing starts (prompt cancelled, key missing or invalidated), so no execution was attempted.
const isKeyAccessFailure = (error: Error): boolean =>
  error instanceof PrivateKeyUnavailableError || error instanceof BiometryInvalidationError

export const reportExecutionFailure = (error: Error, executionMethod: ExecutionMethod, chainId: string): void => {
  if (isKeyAccessFailure(error) || matchUserOutcome(error.message)) {
    return
  }
  const { domain, type, layer, sanitizedMessage } = normalizeError({
    code: TX_EXECUTION_ERROR_CODE,
    message: error.message,
    isUserFacing: true,
  })
  DdRum.addError(sanitizedMessage, ErrorSource.CUSTOM, sanitizeErrorMessage(error.stack ?? ''), {
    error_domain: domain,
    error_type: type,
    error_layer: layer,
    execution_method: executionMethod,
    chain_id: chainId,
  })
}
