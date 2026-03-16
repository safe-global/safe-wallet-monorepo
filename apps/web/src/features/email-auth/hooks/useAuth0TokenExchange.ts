import { useEffect, useRef } from 'react'
import type { IdToken } from '@auth0/auth0-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated as selectIsAuthenticated, setAuthenticated } from '@/store/authSlice'
import { useAuthVerifyV2Mutation } from '../store/auth0Api'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { showNotification } from '@/store/notificationsSlice'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Exchanges an Auth0 id_token for a CGW session cookie via POST /v2/auth/verify.
 *
 * Runs the exchange once when:
 * - Auth0 has authenticated the user (`isAuth0Authed` is true)
 * - CGW session is not yet established
 * - A valid `getIdTokenClaims` function is provided
 */
export function useAuth0TokenExchange(
  isAuth0Authed: boolean,
  getIdTokenClaims: (() => Promise<IdToken | undefined>) | undefined,
) {
  const dispatch = useAppDispatch()
  const isCgwAuthenticated = useAppSelector(selectIsAuthenticated)
  const [verifyAuth0] = useAuthVerifyV2Mutation()
  const exchangingRef = useRef(false)
  const lastIdTokenRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!isAuth0Authed || isCgwAuthenticated || exchangingRef.current || !getIdTokenClaims) return

    exchangingRef.current = true

    const exchange = async () => {
      try {
        const claims = await getIdTokenClaims()
        // Skip if the id_token hasn't changed since the last exchange
        if (!claims?.__raw || claims.__raw === lastIdTokenRef.current) return

        lastIdTokenRef.current = claims.__raw

        await verifyAuth0({ id_token: claims.__raw }).unwrap()
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
  }, [isAuth0Authed, isCgwAuthenticated, getIdTokenClaims, verifyAuth0, dispatch])
}
