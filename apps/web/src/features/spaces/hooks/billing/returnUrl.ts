import { AppRoutes } from '@/config/routes'

/** Stripe replaces this literal with the session id on the way back; it must travel un-encoded. */
export const CHECKOUT_SESSION_ID_PLACEHOLDER = '{CHECKOUT_SESSION_ID}'
export const CHECKOUT_SESSION_QUERY_PARAM = 'sessionId'

// The CGW rejects non-public return URLs, so local development returns to the staging web app.
const STAGING_WEB_ORIGIN = 'https://safe-wallet-web.dev.5afe.dev'

const getPublicOrigin = (): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ? STAGING_WEB_ORIGIN : origin
}

const buildSpaceUrl = (pathname: string, spaceId: string): URL => {
  const url = new URL(pathname, getPublicOrigin())
  url.searchParams.set('spaceId', spaceId)
  return url
}

/** Where Stripe Checkout sends the user back: the Workspace Home carrying the session id. */
export const getCheckoutReturnUrl = (spaceId: string): string =>
  `${buildSpaceUrl(AppRoutes.spaces.index, spaceId)}&${CHECKOUT_SESSION_QUERY_PARAM}=${CHECKOUT_SESSION_ID_PLACEHOLDER}`

/** Where the Stripe customer portal sends the user back: the Plans page. */
export const getPortalReturnUrl = (spaceId: string): string => buildSpaceUrl(AppRoutes.spaces.plans, spaceId).toString()
