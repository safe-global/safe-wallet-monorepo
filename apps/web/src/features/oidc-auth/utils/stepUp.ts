import { GATEWAY_URL } from '@/config/gateway'

const AUTHORIZE_PATH = '/v1/auth/oidc/authorize'

export const startStepUp = (redirectUrl?: string): void => {
  // An `error` left over from an earlier attempt would look like this attempt's
  // failure when the user comes back.
  const returnUrl = new URL(redirectUrl ?? window.location.href)
  returnUrl.searchParams.delete('error')
  returnUrl.searchParams.delete('error_description')

  const url = new URL(AUTHORIZE_PATH, GATEWAY_URL)
  url.searchParams.set('redirect_url', returnUrl.toString())
  url.searchParams.set('elevate', 'true')

  // Not RTK Query: this endpoint answers with a redirect to Auth0's own HTML
  // pages, which `fetch` would follow and then fail to parse as JSON.
  window.location.href = url.toString()
}
