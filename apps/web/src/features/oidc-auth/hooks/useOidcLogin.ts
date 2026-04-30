import { useCallback } from 'react'
import { GATEWAY_URL } from '@/config/gateway'
import { OIDC_AUTH_PENDING_KEY, OIDC_AUTH_CONNECTION_KEY, OidcConnection } from '../constants'
import { AuthLoginMethod } from '@/services/analytics/mixpanel-events'

const AUTHORIZE_PATH = '/v1/auth/oidc/authorize'

/**
 * Hook for initiating the OIDC login flow via CGW.
 *
 * The CGW /v1/auth/oidc/authorize endpoint returns a 302 redirect to the OIDC provider,
 * so we use window.location.href instead of RTK Query (fetch follows redirects
 * automatically and would fail trying to parse the provider's HTML as JSON).
 */
export const useOidcLogin = () => {
  const loginWithRedirect = useCallback((connection: OidcConnection, redirectUrl?: string) => {
    const method = connection === OidcConnection.GOOGLE ? AuthLoginMethod.EMAIL_GOOGLE : AuthLoginMethod.EMAIL_OTP
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')
    sessionStorage.setItem(OIDC_AUTH_CONNECTION_KEY, method)

    // Strip any stale `error` param so the callback can trust that an `error`
    // in the return URL genuinely came from the OIDC provider, not from a
    // previous failed attempt still present in the URL.
    const cleanRedirectUrl = new URL(redirectUrl ?? window.location.href)
    cleanRedirectUrl.searchParams.delete('error')

    const url = new URL(AUTHORIZE_PATH, GATEWAY_URL)
    url.searchParams.set('redirect_url', cleanRedirectUrl.toString())
    url.searchParams.set('connection', connection)
    window.location.href = url.toString()
  }, [])

  return { loginWithRedirect }
}
