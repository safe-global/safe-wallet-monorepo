import { useCallback } from 'react'
import { GATEWAY_URL } from '@/config/gateway'

const AUTHORIZE_PATH = '/v1/auth/oidc/authorize'

/**
 * Error message CGW's ElevationGuard returns when a sensitive action needs a
 * fresh multi-factor authentication (step-up).
 */
export const ELEVATION_REQUIRED_ERROR = 'elevation_required'

export const isElevationRequiredError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false
  const data = 'data' in error ? error.data : undefined
  return typeof data === 'object' && data !== null && 'message' in data && data.message === ELEVATION_REQUIRED_ERROR
}

/**
 * Hook for initiating step-up authentication via CGW.
 *
 * Redirects through CGW's /v1/auth/oidc/authorize with elevate=true, which
 * makes the OIDC provider re-challenge MFA (acr_values + max_age=0) and mint
 * a session whose auth_time is fresh enough to pass the ElevationGuard.
 * Same window.location.href approach as useOidcLogin: the endpoint answers
 * with a 302 to the provider.
 */
export const useStepUp = () => {
  const stepUpWithRedirect = useCallback((redirectUrl?: string) => {
    const cleanRedirectUrl = new URL(redirectUrl ?? window.location.href)
    cleanRedirectUrl.searchParams.delete('error')

    const url = new URL(AUTHORIZE_PATH, GATEWAY_URL)
    url.searchParams.set('redirect_url', cleanRedirectUrl.toString())
    url.searchParams.set('elevate', 'true')
    window.location.href = url.toString()
  }, [])

  return { stepUpWithRedirect }
}
