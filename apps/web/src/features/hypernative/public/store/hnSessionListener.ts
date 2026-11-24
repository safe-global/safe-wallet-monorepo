import type { ListenerEffect, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { isAnyOf } from '@reduxjs/toolkit'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { isHypernativeReconnectRequiredError } from '@safe-global/store/hypernative/hypernativeApi.dto'
import type { listenerMiddlewareInstance, RootState } from '@/store/index'
import { refreshAuthToken } from '../../services/tokenRefresh'
import {
  clearAuthCookie,
  getAuthCookieAuthorization,
  getAuthCookieData,
  getUsableRefreshToken,
} from '../../store/cookieStorage'
import { HYPERNATIVE_OAUTH_CONFIG } from '../services/oauth'
import { hnSessionRejected } from './hnSessionSlice'

const { assessTransaction, assessMessage, getBatchAssessments, exchangeToken } = hypernativeApi.endpoints

const isRejectedAssessment = isAnyOf(
  assessTransaction.matchRejected,
  assessMessage.matchRejected,
  getBatchAssessments.matchRejected,
)

type RejectedAssessment = typeof isRejectedAssessment extends (action: unknown) => action is infer A ? A : never

// The token a refresh gave after a 1038. If the API rejects it too, another refresh will not help.
let recoveredAuthorization: string | undefined

// Module scope keeps the effect's identity, so a second store registering it does not run it twice
const endOrRecoverRejectedSession: ListenerEffect<
  RejectedAssessment,
  RootState,
  ThunkDispatch<RootState, unknown, UnknownAction>
> = async (action, listenerApi) => {
  if (!isHypernativeReconnectRequiredError(action.payload)) {
    return
  }
  const rejectedAuthorization = action.meta.arg.originalArgs.authToken
  if (rejectedAuthorization !== getAuthCookieAuthorization()) {
    return
  }

  // A 1038 also answers an expired token or one signed with a rotated key, and a refresh replaces those.
  // Only a revoked login fails the refresh as well, so only then does the user have to sign in again.
  const authData = getAuthCookieData()
  const refreshToken = authData ? getUsableRefreshToken(authData) : undefined
  if (refreshToken && rejectedAuthorization !== recoveredAuthorization) {
    const outcome = await refreshAuthToken(refreshToken, (token) =>
      listenerApi
        .dispatch(
          exchangeToken.initiate({
            grant_type: 'refresh_token',
            client_id: HYPERNATIVE_OAUTH_CONFIG.clientId,
            refresh_token: token,
          }),
        )
        .unwrap(),
    )
    // A network or server failure says nothing about the login, so the next request tries again
    if (outcome === 'transient') {
      return
    }
    const currentAuthorization = getAuthCookieAuthorization()
    if (currentAuthorization && currentAuthorization !== rejectedAuthorization) {
      recoveredAuthorization = currentAuthorization
      return
    }
  }

  clearAuthCookie()
  listenerApi.dispatch(hnSessionRejected(rejectedAuthorization))
}

export const hnSessionListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    matcher: isRejectedAssessment,
    effect: endOrRecoverRejectedSession,
  })
}
