import { useCallback } from 'react'
import { GATEWAY_URL } from '@/config/gateway'

const EMAIL_AUTH_PENDING_KEY = 'email_auth_pending'
const AUTHORIZE_PATH = '/v1/auth/oidc/authorize'

/**
 * Hook for initiating the email login flow via CGW.
 *
 * The CGW /v1/auth/oidc/authorize endpoint returns a 302 redirect to the OIDC provider,
 * so we use window.location.href instead of RTK Query (fetch follows redirects
 * automatically and would fail trying to parse the provider's HTML as JSON).
 */
export const useEmailLogin = () => {
  const loginWithRedirect = useCallback(() => {
    sessionStorage.setItem(EMAIL_AUTH_PENDING_KEY, '1')
    window.location.href = `${GATEWAY_URL}${AUTHORIZE_PATH}`
  }, [])

  return { loginWithRedirect }
}

export { EMAIL_AUTH_PENDING_KEY }
