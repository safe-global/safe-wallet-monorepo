import { useCallback } from 'react'
import { GATEWAY_URL } from '@/config/gateway'
import { AppRoutes } from '@/config/routes'
import { LOGGING_OUT_KEY } from '@/hooks/useLogoutCallback'

const LOGOUT_REDIRECT_PATH = '/v1/auth/logout/redirect'

/**
 * Hook for logging out via CGW.
 *
 * The /v1/auth/logout/redirect endpoint returns a 303 that, for OIDC users, redirects through
 * the identity provider to clear their session. We submit a hidden form so the browser performs
 * a top-level POST and follows the redirect chain, clearing IdP session cookies.
 *
 * Sets a transient flag in sessionStorage so that after the redirect lands back in the app,
 * `useLogoutCallback` can reconcile with the backend via /v1/auth/me.
 */
const useLogout = () => {
  const logout = useCallback(() => {
    sessionStorage.setItem(LOGGING_OUT_KEY, '1')

    const redirectUrl = new URL(AppRoutes.welcome.spaces, window.location.origin).toString()
    const url = new URL(LOGOUT_REDIRECT_PATH, GATEWAY_URL)

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = url.toString()
    form.style.display = 'none'

    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'redirect_url'
    input.value = redirectUrl
    form.appendChild(input)

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }, [])

  return { logout }
}

export default useLogout
