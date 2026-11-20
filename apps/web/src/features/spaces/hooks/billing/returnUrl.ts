import { CHECKOUT_RETURN_ORIGIN } from '@/config/constants'
import { AppRoutes } from '@/config/routes'

/** Stripe replaces this literal with the session id on the way back; it must travel un-encoded. */
export const _CHECKOUT_SESSION_ID_PLACEHOLDER = '{CHECKOUT_SESSION_ID}'
export const CHECKOUT_SESSION_QUERY_PARAM = 'sessionId'

const getPublicOrigin = (): string =>
  CHECKOUT_RETURN_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '')

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
