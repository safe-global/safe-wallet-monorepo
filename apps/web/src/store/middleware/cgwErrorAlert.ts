import { isRejectedWithValue, type Middleware } from '@reduxjs/toolkit'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { shouldAlertOnCgwStatus } from '@safe-global/utils/services/exceptions/gatewayErrors'
import { getHttpStatusFromError } from '@safe-global/utils/services/exceptions/utils'
import { Errors, logError } from '@/services/exceptions'

const CGW_ACTION_PREFIX = `${cgwClient.reducerPath}/`

/**
 * Raises an internal alert when CGW rejects one of our requests as
 * unprocessable (422). That state is never the user's fault — it means we sent
 * a malformed request — so it is logged as our bug, once per rejected request.
 *
 * The user still only sees the agreed generic copy; nothing extra is surfaced.
 * Only the numeric HTTP status reaches analytics (via `CodedException`), never
 * the response body.
 */
export const cgwErrorAlert: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action) && action.type.startsWith(CGW_ACTION_PREFIX)) {
    const status = getHttpStatusFromError(action.payload)

    if (shouldAlertOnCgwStatus(status)) {
      logError(Errors._622, action.payload)
    }
  }

  return next(action)
}
