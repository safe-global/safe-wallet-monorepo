import { useCallback, useEffect, useState } from 'react'
import { useAuthGetMeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { GATEWAY_URL } from '@/config/gateway'

const AUTHENTICATORS_PATH = '/v1/auth/oidc/mfa/authenticators'
const AUTHORIZE_PATH = '/v1/auth/oidc/authorize'

export type Authenticator = {
  id: string
  type: string
  name?: string
  createdAt?: string
}

/**
 * Self-service authenticator management. Listing is served by CGW; adding
 * or replacing happens on the provider's hosted pages: the enroll redirect
 * makes Auth0 challenge an existing factor (the current authenticator, or
 * the recovery code via "Try another method") and then walks the user
 * through enrolling the new one. On return, CGW removes superseded
 * enrollments. The recovery code survives throughout — Auth0 only mints a
 * new one when none exists.
 */
export const useAuthenticators = () => {
  const { data: session } = useAuthGetMeV1Query()
  const [authenticators, setAuthenticators] = useState<Array<Authenticator>>()
  const [error, setError] = useState<string>()

  const isOidcSession = session?.authMethod === 'oidc'

  useEffect(() => {
    if (!isOidcSession) return

    let cancelled = false

    const fetchAuthenticators = async () => {
      try {
        const res = await fetch(new URL(AUTHENTICATORS_PATH, GATEWAY_URL), { credentials: 'include' })
        if (!res.ok) {
          throw new Error(`Loading authenticators failed (status ${res.status})`)
        }
        const methods: Array<Authenticator> = await res.json()
        if (!cancelled) {
          setAuthenticators(methods.filter((method) => method.type === 'totp'))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong')
        }
      }
    }

    void fetchAuthenticators()

    return () => {
      cancelled = true
    }
  }, [isOidcSession])

  const enrollNewAuthenticator = useCallback(() => {
    const returnUrl = new URL(window.location.href)
    returnUrl.searchParams.delete('error')

    const url = new URL(AUTHORIZE_PATH, GATEWAY_URL)
    url.searchParams.set('redirect_url', returnUrl.toString())
    url.searchParams.set('enroll', 'true')
    window.location.href = url.toString()
  }, [])

  return { isOidcSession, authenticators, error, enrollNewAuthenticator }
}
