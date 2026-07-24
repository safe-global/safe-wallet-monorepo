import { useCallback, useMemo } from 'react'
import {
  useAuthGetMeV1Query,
  useOidcAuthListAuthenticatorsV1Query,
  type Authenticator,
} from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { GATEWAY_URL } from '@/config/gateway'

export type { Authenticator }

const AUTHORIZE_PATH = '/v1/auth/oidc/authorize'

/**
 * Self-service authenticator management. Listing is served by CGW via RTK
 * Query (shared with mobile from the store package); adding or replacing
 * happens on the provider's hosted pages: the enroll redirect makes Auth0
 * challenge an existing factor (the current authenticator, or the recovery
 * code via "Try another method") and then walks the user through enrolling
 * the new one. On return, CGW removes superseded enrollments. The recovery
 * code survives throughout — Auth0 only mints a new one when none exists.
 *
 * The redirect is web-specific and stays here; the data fetch lives in the
 * shared store package.
 */
export const useAuthenticators = () => {
  const { data: session } = useAuthGetMeV1Query()
  const isOidcSession = session?.authMethod === 'oidc'

  const { data, error } = useOidcAuthListAuthenticatorsV1Query(undefined, {
    skip: !isOidcSession,
  })

  const authenticators = useMemo(() => (data ? data.filter((method) => method.type === 'totp') : undefined), [data])

  const enrollNewAuthenticator = useCallback(() => {
    const returnUrl = new URL(window.location.href)
    returnUrl.searchParams.delete('error')

    const url = new URL(AUTHORIZE_PATH, GATEWAY_URL)
    url.searchParams.set('redirect_url', returnUrl.toString())
    url.searchParams.set('enroll', 'true')
    window.location.href = url.toString()
  }, [])

  return {
    isOidcSession,
    authenticators,
    error: error ? 'Loading authenticators failed' : undefined,
    enrollNewAuthenticator,
  }
}
