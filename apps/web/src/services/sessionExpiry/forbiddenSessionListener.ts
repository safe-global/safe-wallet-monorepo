import { isRejectedWithValue, type UnknownAction } from '@reduxjs/toolkit'
import { cgwClient, isCredentialRoute } from '@safe-global/store/gateway/cgwClient'
import { cgwApi as authApi } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import type { listenerMiddlewareInstance, RootState } from '@/store'
import { isAuthenticated, setSessionCheckPending } from '@/store/authSlice'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import { expireSession, isForbidden } from './expireSession'

const CGW_ACTION_PREFIX = `${cgwClient.reducerPath}/`
const AUTH_ME_ENDPOINT: keyof typeof authApi.endpoints = 'authGetMeV1'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const getRequestUrl = ({ meta }: UnknownAction): string | undefined => {
  const request = isRecord(meta) && isRecord(meta.baseQueryMeta) ? meta.baseQueryMeta.request : undefined
  return isRecord(request) && typeof request.url === 'string' ? request.url : undefined
}

const getEndpointName = ({ meta }: UnknownAction): string | undefined => {
  const arg = isRecord(meta) ? meta.arg : undefined
  return isRecord(arg) && typeof arg.endpointName === 'string' ? arg.endpointName : undefined
}

export const isSessionForbiddenRejection = (action: UnknownAction, state: RootState): boolean => {
  if (!action.type.startsWith(CGW_ACTION_PREFIX)) return false
  if (!isAuthenticated(state)) return false
  if (!isForbidden(action.payload) || isElevationRequiredError(action.payload)) return false
  if (getEndpointName(action) === AUTH_ME_ENDPOINT) return false
  const url = getRequestUrl(action)
  return url !== undefined && isCredentialRoute(url)
}

// A single 403 is not proof the cookie is gone, so /v1/auth/me is asked before the session is expired.
export const forbiddenSessionListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    matcher: isRejectedWithValue(),
    effect: async (action, { dispatch, getState, unsubscribe, subscribe }) => {
      if (!isSessionForbiddenRejection(action, getState())) return

      unsubscribe()
      const probedSession = getState().auth.sessionExpiresAt
      dispatch(setSessionCheckPending(true))
      const probe = dispatch(authApi.endpoints.authGetMeV1.initiate(undefined, { forceRefetch: true }))
      try {
        await probe.unwrap()
      } catch (error) {
        const isSameSession = getState().auth.sessionExpiresAt === probedSession
        if (isForbidden(error) && isSameSession) dispatch(expireSession(window.location.pathname))
      } finally {
        probe.unsubscribe()
        dispatch(setSessionCheckPending(false))
        subscribe()
      }
    },
  })
}
