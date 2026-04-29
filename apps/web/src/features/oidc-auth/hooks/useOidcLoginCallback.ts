import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch } from '@/store'
import { setIsOidcLoginPending } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import reconcileAuth from '@/store/reconcileAuth'
import {
  DEFAULT_SIGN_IN_ERROR_MESSAGE,
  OIDC_AUTH_PENDING_KEY,
  OIDC_AUTH_CONNECTION_KEY,
  SIGN_IN_ERROR_DESCRIPTION_MAP,
} from '../constants'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { AuthLoginMethod, MixpanelEventParams } from '@/services/analytics/mixpanel-events'

const getErrorNotification = (errorDescription: string | null) => ({
  message:
    errorDescription && Object.hasOwn(SIGN_IN_ERROR_DESCRIPTION_MAP, errorDescription)
      ? SIGN_IN_ERROR_DESCRIPTION_MAP[errorDescription]
      : DEFAULT_SIGN_IN_ERROR_MESSAGE,
  variant: 'error' as const,
  groupKey: 'email-sign-in-failed',
})

/**
 * Detects post-OIDC redirect and updates auth state.
 *
 * After the CGW redirects back from the OIDC provider, the HTTP-only JWT cookie
 * is already set. This hook checks sessionStorage for a pending flag (set before
 * redirect) and dispatches setAuthenticated to update Redux state.
 *
 * If the redirect contains an `error` query param (OIDC failure), it shows an
 * error notification instead and cleans up the URL.
 *
 * Should be called globally (e.g., in InitApp) so it runs on page load.
 */
export const useOidcLoginCallback = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const isOidcAuthEnabled = useHasFeature(FEATURES.OIDC_AUTH)
  const routerRef = useRef(router)
  const hasProcessed = useRef(false)

  routerRef.current = router

  useEffect(() => {
    if (!isOidcAuthEnabled || hasProcessed.current) return

    const pending = sessionStorage.getItem(OIDC_AUTH_PENDING_KEY)
    if (!pending) return

    hasProcessed.current = true
    dispatch(setIsOidcLoginPending(true))

    const processCallback = async () => {
      const params = new URLSearchParams(window.location.search)

      if (params.has('error')) {
        const errorDescription = params.get('error_description')
        dispatch(showNotification(getErrorNotification(errorDescription)))
        const method =
          (sessionStorage.getItem(OIDC_AUTH_CONNECTION_KEY) as AuthLoginMethod) ?? AuthLoginMethod.EMAIL_OTP
        trackEvent(SPACE_EVENTS.AUTH_LOGIN_FAILED, {
          [MixpanelEventParams.FAILURE_REASON]: errorDescription ?? 'unknown',
          method,
        })

        // Read params from window.location.search instead of
        // router.query, which may still be empty before router.isReady on first render.
        params.delete('error')
        params.delete('error_description')
        const cleanQuery = Object.fromEntries(params.entries())
        routerRef.current.replace({ pathname: routerRef.current.pathname, query: cleanQuery }, undefined, {
          shallow: true,
        })
      } else {
        const result = await reconcileAuth(dispatch)
        if (result === 'unauthenticated') {
          dispatch(showNotification(getErrorNotification(null)))
        } else {
          const method =
            (sessionStorage.getItem(OIDC_AUTH_CONNECTION_KEY) as AuthLoginMethod) ?? AuthLoginMethod.EMAIL_OTP
          trackEvent(SPACE_EVENTS.AUTH_LOGIN_SUCCEEDED, { method, timestamp: new Date().toISOString() })
        }
      }

      sessionStorage.removeItem(OIDC_AUTH_PENDING_KEY)
      sessionStorage.removeItem(OIDC_AUTH_CONNECTION_KEY)
      dispatch(setIsOidcLoginPending(false))
    }

    void processCallback()
  }, [dispatch, isOidcAuthEnabled])
}
