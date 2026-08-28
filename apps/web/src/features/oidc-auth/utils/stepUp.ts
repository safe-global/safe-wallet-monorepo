import { GATEWAY_URL } from '@/config/gateway'

const AUTHORIZE_PATH = '/v1/auth/oidc/authorize'

/**
 * Set while a return is being processed, so an `elevation_required` raised by
 * the replayed action itself cannot bounce the user straight back out to the
 * provider. Module state, not storage: it must not survive the page load.
 */
let isHandlingStepUpReturn = false

export const markStepUpReturnHandled = (): void => {
  isHandlingStepUpReturn = true
}

export const resetStepUpReturnGuard = (): void => {
  isHandlingStepUpReturn = false
}

export const isStepUpReturnInFlight = (): boolean => isHandlingStepUpReturn

/**
 * A `window.location.href` navigation rather than RTK Query: the endpoint
 * answers with a redirect to the provider's own HTML pages, which `fetch` would
 * follow and then fail to parse as JSON.
 */
export const startStepUp = (redirectUrl?: string): boolean => {
  if (isHandlingStepUpReturn) return false

  // A stale `error` here would be read on the return leg as this attempt's.
  const returnUrl = new URL(redirectUrl ?? window.location.href)
  returnUrl.searchParams.delete('error')
  returnUrl.searchParams.delete('error_description')

  const url = new URL(AUTHORIZE_PATH, GATEWAY_URL)
  url.searchParams.set('redirect_url', returnUrl.toString())
  url.searchParams.set('elevate', 'true')
  window.location.href = url.toString()

  return true
}
