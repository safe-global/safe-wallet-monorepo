import { useCallback } from 'react'
import { GATEWAY_URL } from '@/config/gateway'

export const EMAIL_AUTH_PENDING_KEY = 'email_auth_pending'
const AUTHORIZE_PATH = '/v1/auth/oidc/authorize'

export enum OidcConnection {
  EMAIL = 'email',
  GOOGLE = 'google-oauth2',
}

/**
 * Hook for initiating the OIDC login flow via CGW.
 *
 * The CGW /v1/auth/oidc/authorize endpoint returns a 302 redirect to the OIDC provider,
 * so we use window.location.href instead of RTK Query (fetch follows redirects
 * automatically and would fail trying to parse the provider's HTML as JSON).
 */
export const useEmailLogin = () => {
  const loginWithRedirect = useCallback((connection: OidcConnection, redirectUrl?: string) => {
    sessionStorage.setItem(EMAIL_AUTH_PENDING_KEY, '1')
    const url = new URL(AUTHORIZE_PATH, GATEWAY_URL)
    url.searchParams.set('redirect_url', redirectUrl ?? window.location.href)
    url.searchParams.set('connection', connection)
    window.location.href = url.toString()
  }, [])

  return { loginWithRedirect }
}
