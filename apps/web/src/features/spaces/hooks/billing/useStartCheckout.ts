import { useCallback } from 'react'
import { useLazyBillingGetCheckoutUrlV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { getCheckoutReturnUrl } from './returnUrl'
import { useBillingSpaceId } from './useBillingSpaceId'

/** Requests a Stripe Checkout URL for an offered payment link and sends the browser there. */
export const useStartCheckout = (spaceId?: string | null, returnPathname?: string) => {
  const gatedSpaceId = useBillingSpaceId(spaceId)
  const [trigger, { isFetching, isError }] = useLazyBillingGetCheckoutUrlV1Query()

  const startCheckout = useCallback(
    async (paymentLinkId: string) => {
      if (!gatedSpaceId) return
      const result = await trigger({
        spaceId: gatedSpaceId,
        paymentLinkId,
        returnUrl: getCheckoutReturnUrl(gatedSpaceId, returnPathname),
      })
      if (result.data) window.location.assign(result.data.url)
    },
    [gatedSpaceId, returnPathname, trigger],
  )

  return { startCheckout, isRedirecting: isFetching, isError }
}
