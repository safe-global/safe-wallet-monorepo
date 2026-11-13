import { isAnyOf } from '@reduxjs/toolkit'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { isHypernativeReconnectRequiredError } from '@safe-global/store/hypernative/hypernativeApi.dto'
import type { listenerMiddlewareInstance } from '@/store/index'
import { clearAuthCookie, getAuthCookieAuthorization } from './cookieStorage'
import { hnSessionRejected } from './hnSessionSlice'

const { assessTransaction, assessMessage, getBatchAssessments } = hypernativeApi.endpoints

const isRejectedAssessment = isAnyOf(
  assessTransaction.matchRejected,
  assessMessage.matchRejected,
  getBatchAssessments.matchRejected,
)

export const hnSessionListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    matcher: isRejectedAssessment,
    effect: (action, listenerApi) => {
      if (!isHypernativeReconnectRequiredError(action.payload)) {
        return
      }
      const rejectedAuthorization = action.meta.arg.originalArgs.authToken
      if (rejectedAuthorization !== getAuthCookieAuthorization()) {
        return
      }
      clearAuthCookie()
      listenerApi.dispatch(hnSessionRejected(rejectedAuthorization))
    },
  })
}
