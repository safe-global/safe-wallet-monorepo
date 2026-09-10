import { useCallback } from 'react'
import { useLazyBillingGetSessionUrlV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { getPortalReturnUrl } from './returnUrl'
import { useBillingSpaceId } from './useBillingSpaceId'

/** Opens the Stripe customer portal (billing details, invoices, cancellation). */
export const useBillingPortal = (spaceId?: string | null) => {
  const gatedSpaceId = useBillingSpaceId(spaceId)
  const [trigger, { isFetching, isError }] = useLazyBillingGetSessionUrlV1Query()

  const openPortal = useCallback(async () => {
    if (!gatedSpaceId) return
    const result = await trigger({ spaceId: gatedSpaceId, returnUrl: getPortalReturnUrl(gatedSpaceId) })
    if (result.data) window.location.assign(result.data.url)
  }, [gatedSpaceId, trigger])

  return { openPortal, isRedirecting: isFetching, isError }
}
