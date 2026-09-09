/**
 * Classifies a failed CGW request against the shared response-state contract
 * (`@safe-global/utils/services/exceptions/gatewayErrors`) so every surface —
 * inline submit errors, notification toasts — renders the same copy. The code
 * classifies the response state; it is never shown to the user.
 */
import {
  getCgwErrorCode,
  getCgwErrorMeta,
  type CgwErrorMeta,
} from '@safe-global/utils/services/exceptions/gatewayErrors'
import { getHttpStatusFromError } from '@safe-global/utils/services/exceptions/utils'

export interface CgwErrorInfo extends CgwErrorMeta {
  status: number
  /** Classifies the response state for telemetry and tests — never shown to the user. */
  code: string
}

/**
 * Returns the agreed copy for a known CGW response state, or `undefined` when the error is not
 * one we have agreed copy for (the caller then keeps its existing behaviour).
 */
export const getCgwErrorInfo = (error: unknown): CgwErrorInfo | undefined => {
  const status = getHttpStatusFromError(error)
  const meta = getCgwErrorMeta(status)

  return status === undefined || !meta ? undefined : { ...meta, status, code: getCgwErrorCode(status) }
}

/** Classification code for a known CGW response state. */
export const getCgwSupportCode = (error: unknown): string | undefined => getCgwErrorInfo(error)?.code
