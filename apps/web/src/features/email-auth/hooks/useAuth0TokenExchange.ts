import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated as selectIsAuthenticated, setAuthenticated } from '@/store/authSlice'
import { useAuthVerifyV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { showNotification } from '@/store/notificationsSlice'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Exchanges an Auth0 access token for a CGW session cookie via POST /v1/auth/verify.
 *
 * Runs the exchange once when:
 * - Auth0 has authenticated the user (`isAuth0Authed` is true)
 * - CGW session is not yet established
 * - A valid `getAccessToken` function is provided
 */
export function useAuth0TokenExchange(isAuth0Authed: boolean, getAccessToken: (() => Promise<string>) | undefined) {
  const dispatch = useAppDispatch()
  const isCgwAuthenticated = useAppSelector(selectIsAuthenticated)
  const [verifyAuth] = useAuthVerifyV1Mutation()
  const exchangingRef = useRef(false)
  const lastTokenRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!isAuth0Authed || isCgwAuthenticated || exchangingRef.current || !getAccessToken) return

    exchangingRef.current = true

    const exchange = async () => {
      try {
        const accessToken = await getAccessToken()
        // Skip if the access token hasn't changed since the last exchange
        if (!accessToken || accessToken === lastTokenRef.current) return

        lastTokenRef.current = accessToken

        await verifyAuth({ body: { access_token: accessToken } }).unwrap()
        dispatch(setAuthenticated(Date.now() + ONE_DAY_MS))
      } catch (err) {
        logError(ErrorCodes._640, err instanceof Error ? err.message : 'Auth0 token exchange failed')
        dispatch(
          showNotification({
            message: 'Something went wrong while signing in with email',
            variant: 'error',
            groupKey: 'email-sign-in-failed',
          }),
        )
      } finally {
        exchangingRef.current = false
      }
    }

    exchange()
  }, [isAuth0Authed, isCgwAuthenticated, getAccessToken, verifyAuth, dispatch])
}
