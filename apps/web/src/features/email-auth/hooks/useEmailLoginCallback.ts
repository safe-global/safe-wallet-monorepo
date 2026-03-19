import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch } from '@/store'
import { setAuthenticated } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { EMAIL_AUTH_PENDING_KEY } from './useEmailLogin'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

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
  const routerRef = useRef(router)
  const hasProcessed = useRef(false)

  routerRef.current = router

  useEffect(() => {
    if (hasProcessed.current) return

    const pending = sessionStorage.getItem(EMAIL_AUTH_PENDING_KEY)
    if (!pending) return

    hasProcessed.current = true
    sessionStorage.removeItem(EMAIL_AUTH_PENDING_KEY)

    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')

    if (error) {
      dispatch(
        showNotification({
          message: 'Something went wrong while signing in with email',
          variant: 'error',
          groupKey: 'email-sign-in-failed',
        }),
      )

      // Clean error param from URL using Next.js router to keep router state in sync
      const { error: _error, ...restQuery } = routerRef.current.query
      routerRef.current.replace({ pathname: routerRef.current.pathname, query: restQuery }, undefined, {
        shallow: true,
      })
      return
    }

    // TODO: The pending flag alone doesn't prove the login completed. If a user starts
    // the OIDC flow and navigates back without finishing, this path still runs. Ideally
    // we'd verify the JWT cookie was minted (e.g. via a CGW /v1/auth/me endpoint) before
    // marking the session as authenticated. Existing endpoints like /v1/users require a
    // connected signer so they can't be used here.
    dispatch(setAuthenticated(Date.now() + ONE_DAY_MS))
  }, [dispatch])
}
