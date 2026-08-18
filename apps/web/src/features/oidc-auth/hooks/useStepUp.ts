import { useCallback } from 'react'
import { GATEWAY_URL } from '@/config/gateway'
import { STEP_UP_PENDING_KEY } from '../constants'

const AUTHORIZE_PATH = '/v1/auth/oidc/authorize'

/**
 * Starts step-up authentication (a fresh second factor) for the current session.
 *
 * Redirects through CGW's `/v1/auth/oidc/authorize?elevate=true`, which asks the
 * provider for a multi-factor `acr_values` and, on the way back, stamps
 * `mfa_verified_at` on a new session cookie. As with `useOidcLogin` this has to
 * be a `window.location.href` navigation and not RTK Query: the endpoint answers
 * with a 302 to the provider's HTML pages, which `fetch` would follow and then
 * fail to parse as JSON.
 *
 * A pending marker distinct from `OIDC_AUTH_PENDING_KEY` is set so that
 * `useStepUpCallback` handles the return without `useOidcLoginCallback`
 * mistaking a step-up for a sign-in and emitting a login event.
 */
export const useStepUp = () => {
  const stepUpWithRedirect = useCallback((redirectUrl?: string) => {
    // Strip any stale `error` param so the return leg can trust that an `error`
    // in the URL genuinely came from the provider this time round.
    const returnUrl = new URL(redirectUrl ?? window.location.href)
    returnUrl.searchParams.delete('error')
    returnUrl.searchParams.delete('error_description')

    sessionStorage.setItem(STEP_UP_PENDING_KEY, '1')

    const url = new URL(AUTHORIZE_PATH, GATEWAY_URL)
    url.searchParams.set('redirect_url', returnUrl.toString())
    url.searchParams.set('elevate', 'true')
    window.location.href = url.toString()
  }, [])

  return { stepUpWithRedirect }
}
