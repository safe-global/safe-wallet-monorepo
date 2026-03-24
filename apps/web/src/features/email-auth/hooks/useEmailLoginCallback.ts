import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useAppDispatch } from '@/store'
import { setAuthenticated, setIsEmailLoginPending } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { EMAIL_AUTH_PENDING_KEY } from './useEmailLogin'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

const EMAIL_SIGN_IN_ERROR = {
  message: 'Something went wrong while signing in with email',
  variant: 'error' as const,
  groupKey: 'email-sign-in-failed',
}

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
export const useEmailLoginCallback = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const isEmailAuthEnabled = useHasFeature(FEATURES.EMAIL_AUTH)
  const routerRef = useRef(router)
  const hasProcessed = useRef(false)

  routerRef.current = router

  useEffect(() => {
    if (!isEmailAuthEnabled || hasProcessed.current) return

    const pending = sessionStorage.getItem(EMAIL_AUTH_PENDING_KEY)
    if (!pending) return

    hasProcessed.current = true
    dispatch(setIsEmailLoginPending(true))

    const processCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const error = params.get('error')

        if (error) {
          dispatch(showNotification(EMAIL_SIGN_IN_ERROR))

          // Read params from window.location.search instead of
          // router.query, which may still be empty before router.isReady on first render.
          params.delete('error')
          const cleanQuery = Object.fromEntries(params.entries())
          routerRef.current.replace({ pathname: routerRef.current.pathname, query: cleanQuery }, undefined, {
            shallow: true,
          })
          return
        }

        await dispatch(cgwApi.endpoints.authGetMeV1.initiate()).unwrap()
        dispatch(setAuthenticated(Date.now() + ONE_DAY_MS))
      } catch {
        dispatch(showNotification(EMAIL_SIGN_IN_ERROR))
      } finally {
        sessionStorage.removeItem(EMAIL_AUTH_PENDING_KEY)
        dispatch(setIsEmailLoginPending(false))
      }
    }

    void processCallback()
  }, [dispatch, isEmailAuthEnabled])
}
