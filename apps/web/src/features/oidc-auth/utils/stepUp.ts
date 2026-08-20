import { GATEWAY_URL } from '@/config/gateway'
import { STEP_UP_PENDING_KEY } from '../constants'

const AUTHORIZE_PATH = '/v1/auth/oidc/authorize'

/**
 * Set while a step-up return is being processed, so an `elevation_required`
 * raised by the replayed action itself cannot bounce the user straight back out
 * to the provider. `useStepUpCallback` sets it before replaying and resets it
 * once processing ends — left set, it would swallow every later challenge in
 * the tab until a full reload.
 */
let isHandlingStepUpReturn = false

export const markStepUpReturnHandled = (): void => {
  isHandlingStepUpReturn = true
}

export const resetStepUpReturnGuard = (): void => {
  isHandlingStepUpReturn = false
}

/**
 * Sends the user to the provider's hosted page to confirm a second factor.
 *
 * Goes through CGW's `/v1/auth/oidc/authorize?elevate=true`, which asks the
 * provider for a fresh multi-factor challenge and, on the way back, mints an
 * elevated session cookie. This has to be a `window.location.href` navigation
 * and not RTK Query: the endpoint answers with a redirect to the provider's own
 * HTML pages, which `fetch` would follow and then fail to parse as JSON.
 *
 * A pending marker distinct from `OIDC_AUTH_PENDING_KEY` is set so the return is
 * handled by `useStepUpCallback` without `useOidcLoginCallback` mistaking a
 * step-up for a sign-in and emitting a login event.
 *
 * Returns whether the navigation was started, so callers can tell a suppressed
 * attempt from a real one.
 */
export const startStepUp = (redirectUrl?: string): boolean => {
  // Already on the way out, or the challenge just failed for this page load.
  if (isHandlingStepUpReturn || sessionStorage.getItem(STEP_UP_PENDING_KEY)) return false

  // Strip any stale `error` param so the return leg can trust that an `error` in
  // the URL genuinely came from the provider this time round.
  const returnUrl = new URL(redirectUrl ?? window.location.href)
  returnUrl.searchParams.delete('error')
  returnUrl.searchParams.delete('error_description')

  sessionStorage.setItem(STEP_UP_PENDING_KEY, '1')

  const url = new URL(AUTHORIZE_PATH, GATEWAY_URL)
  url.searchParams.set('redirect_url', returnUrl.toString())
  url.searchParams.set('elevate', 'true')
  window.location.href = url.toString()

  return true
}
