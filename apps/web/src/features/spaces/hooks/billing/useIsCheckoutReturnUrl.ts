import { useRouter } from 'next/compat/router'
import { parse } from 'querystring'
import { useIsHydrated } from '@/hooks/useIsHydrated'
import { CHECKOUT_SESSION_QUERY_PARAM } from './returnUrl'
import { useBillingSpaceId } from './useBillingSpaceId'

const getLocationSessionId = (): unknown =>
  typeof location === 'undefined' ? undefined : parse(location.search.slice(1))[CHECKOUT_SESSION_QUERY_PARAM]

/**
 * True while the URL carries the session of a checkout that the page is confirming. Gated like useCheckoutReturn,
 * so a session id that no checkout return will ever confirm and remove does not count.
 */
export const useIsCheckoutReturnUrl = (): boolean => {
  const isBillingActive = useBillingSpaceId() !== null
  // Like useUrlSpaceId: read the location until the router has the query
  const query = useRouter()?.query ?? {}
  const isHydrated = useIsHydrated()
  const sessionId = query[CHECKOUT_SESSION_QUERY_PARAM] ?? (isHydrated ? getLocationSessionId() : undefined)
  return isBillingActive && Boolean(sessionId)
}
