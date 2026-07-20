import { AppRoutes } from '@/config/routes'

/**
 * Stripe substitutes this literal placeholder with the real checkout session id
 * when redirecting back. Must be sent verbatim in the returnUrl.
 */
export const CHECKOUT_SESSION_ID_PLACEHOLDER = '{CHECKOUT_SESSION_ID}'

/**
 * The CGW rejects non-public return URLs (e.g. `localhost`), so during local
 * development we point Stripe back at the staging web app. In deployed
 * environments we use the real origin.
 * TODO(billing): drive this from an env var once billing ships.
 */
const STAGING_WEB_ORIGIN = 'https://safe-wallet-web.dev.5afe.dev'

const getBillingOrigin = (): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return /^https?:\/\/localhost(:\d+)?$/.test(origin) ? STAGING_WEB_ORIGIN : origin
}

/** Absolute Billing URL for a space, used as the Stripe returnUrl base. */
export const getBillingReturnUrl = (spaceId: string, withSessionId = false): string => {
  const url = new URL(AppRoutes.spaces.billing, getBillingOrigin())
  url.searchParams.set('spaceId', spaceId)
  if (!withSessionId) return url.toString()
  // Appended raw so Stripe's placeholder isn't URL-encoded.
  return `${url.toString()}&sessionId=${CHECKOUT_SESSION_ID_PLACEHOLDER}`
}
