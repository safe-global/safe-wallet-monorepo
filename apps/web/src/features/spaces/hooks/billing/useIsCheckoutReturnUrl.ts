import { useRouter } from 'next/compat/router'
import { parse } from 'querystring'
import { useIsHydrated } from '@/hooks/useIsHydrated'
import { CHECKOUT_SESSION_QUERY_PARAM } from './returnUrl'

const getLocationSessionId = (): unknown =>
  typeof location === 'undefined' ? undefined : parse(location.search.slice(1))[CHECKOUT_SESSION_QUERY_PARAM]

/** True while the URL still carries the session of a checkout that the page has not finished confirming. */
export const useIsCheckoutReturnUrl = (): boolean => {
  // Like useUrlSpaceId: read the location until the router has the query
  const query = useRouter()?.query ?? {}
  const isHydrated = useIsHydrated()
  return Boolean(query[CHECKOUT_SESSION_QUERY_PARAM] ?? (isHydrated ? getLocationSessionId() : undefined))
}
