/**
 * Classifies a failed CGW request against the shared response-state contract
 * (`@safe-global/utils/services/exceptions/gatewayErrors`) so every surface —
 * inline submit errors, notification toasts — renders the same copy. The status
 * is never shown to the user.
 */
import { getCgwErrorMeta, type CgwErrorMeta } from '@safe-global/utils/services/exceptions/gatewayErrors'
import { getHttpStatusFromError } from '@safe-global/utils/services/exceptions/utils'

export interface CgwErrorInfo extends CgwErrorMeta {
  status: number
}

/**
 * Returns the agreed copy for a known CGW response state, or `undefined` when the error is not
 * one we have agreed copy for (the caller then keeps its existing behaviour).
 */
export const getCgwErrorInfo = (error: unknown): CgwErrorInfo | undefined => {
  const status = getHttpStatusFromError(error)
  const meta = getCgwErrorMeta(status)

  return status === undefined || !meta ? undefined : { ...meta, status }
}
