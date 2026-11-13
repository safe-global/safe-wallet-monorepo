import { AppRoutes } from '@/config/routes'
import { GATEWAY_URL } from '@/config/gateway'

/** Stripe replaces this literal with the session id on the way back; it must travel un-encoded. */
export const _CHECKOUT_SESSION_ID_PLACEHOLDER = '{CHECKOUT_SESSION_ID}'
export const CHECKOUT_SESSION_QUERY_PARAM = 'sessionId'

// A hosted CGW rejects non-public return URLs, so local development returns to the staging web app.
const STAGING_WEB_ORIGIN = 'https://safe-wallet-web.dev.5afe.dev'
const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

const getPublicOrigin = (): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  // A gateway on loopback (the isolated stack) accepts loopback returns, so the checkout comes back here.
  const isLocalGateway = LOOPBACK_ORIGIN.test(new URL(GATEWAY_URL).origin)
  return LOOPBACK_ORIGIN.test(origin) && !isLocalGateway ? STAGING_WEB_ORIGIN : origin
}

const buildSpaceUrl = (pathname: string, spaceId: string): URL => {
  const url = new URL(pathname, getPublicOrigin())
  url.searchParams.set('spaceId', spaceId)
  return url
}

export const getCheckoutReturnUrl = (spaceId: string, pathname: string = AppRoutes.spaces.index): string =>
  `${buildSpaceUrl(pathname, spaceId)}&${CHECKOUT_SESSION_QUERY_PARAM}=${_CHECKOUT_SESSION_ID_PLACEHOLDER}`

/** The onboarding's return: a new Workspace has no ID yet when its checkout URL is requested. */
export const getWizardReturnUrl = (pathname: string, spaceId: string | null): string => {
  const url = new URL(pathname, getPublicOrigin())
  if (spaceId) url.searchParams.set('spaceId', spaceId)
  return `${url}${url.search ? '&' : '?'}${CHECKOUT_SESSION_QUERY_PARAM}=${_CHECKOUT_SESSION_ID_PLACEHOLDER}`
}

export const getPortalReturnUrl = (spaceId: string): string => buildSpaceUrl(AppRoutes.spaces.plans, spaceId).toString()
