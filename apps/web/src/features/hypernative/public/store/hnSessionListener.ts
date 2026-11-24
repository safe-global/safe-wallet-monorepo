import { isAnyOf } from '@reduxjs/toolkit'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { isHypernativeReconnectRequiredError } from '@safe-global/store/hypernative/hypernativeApi.dto'
import type { listenerMiddlewareInstance } from '@/store/index'
import {
  clearAuthCookie,
  getAuthCookieAuthorization,
  getAuthCookieData,
  getUsableRefreshToken,
} from '../../store/cookieStorage'
import { refreshAuthToken, type ExchangeRefreshToken, type RefreshOutcome } from '../../services/tokenRefresh'
import { HYPERNATIVE_OAUTH_CONFIG } from '../services/oauth'
import { clearAssessments } from './hnQueueAssessmentsSlice'
import { hnSessionRejected } from './hnSessionSlice'

const { assessTransaction, assessMessage, getBatchAssessments, exchangeToken } = hypernativeApi.endpoints

const isRejectedAssessment = isAnyOf(
  assessTransaction.matchRejected,
  assessMessage.matchRejected,
  getBatchAssessments.matchRejected,
)

const refreshRejectedSession = async (exchange: ExchangeRefreshToken): Promise<RefreshOutcome> => {
  const data = getAuthCookieData()
  const refreshToken = data ? getUsableRefreshToken(data) : undefined
  return refreshToken ? refreshAuthToken(refreshToken, exchange) : 'unusable'
}

// 1038 also covers an expired token or a bad signature, so only a 1038 right after a refresh is final
let recoveredAuthorization: string | undefined

const handleRejectedAssessment: Parameters<typeof listenerMiddlewareInstance.startListening>[0]['effect'] = async (
  action,
  listenerApi,
) => {
  if (!isRejectedAssessment(action) || !isHypernativeReconnectRequiredError(action.payload)) {
    return
  }
  const rejectedAuthorization = action.meta.arg.originalArgs.authToken
  if (rejectedAuthorization !== getAuthCookieAuthorization()) {
    return
  }

  if (rejectedAuthorization !== recoveredAuthorization) {
    const outcome = await refreshRejectedSession((refreshToken) =>
      listenerApi
        .dispatch(
          exchangeToken.initiate({
            grant_type: 'refresh_token',
            client_id: HYPERNATIVE_OAUTH_CONFIG.clientId,
            refresh_token: refreshToken,
          }),
        )
        .unwrap(),
    )
    if (outcome === 'refreshed') {
      recoveredAuthorization = getAuthCookieAuthorization()
      listenerApi.dispatch(clearAssessments())
      return
    }
    if (outcome === 'superseded' || outcome === 'transient') {
      return
    }
  }

  clearAuthCookie()
  listenerApi.dispatch(hnSessionRejected(rejectedAuthorization))
}

export const hnSessionListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({ matcher: isRejectedAssessment, effect: handleRejectedAssessment })
}
