import { useCallback } from 'react'
import { useLazyBillingGetCheckoutUrlV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { getCheckoutReturnUrl } from './returnUrl'
import { useBillingSpaceId } from './useBillingSpaceId'
import { navigateTo } from '@/utils/navigation'

/** What the checkout is for (plan, seats, period, entry point); tracked and, later, passed on as session metadata. */
export type CheckoutProps = Record<string, unknown>

export const useStartCheckout = (spaceId?: string | null, returnPathname?: string) => {
  const gatedSpaceId = useBillingSpaceId(spaceId)
  const [trigger, { isFetching, isError }] = useLazyBillingGetCheckoutUrlV1Query()

  const startCheckout = useCallback(
    async (paymentLinkId: string, props: CheckoutProps) => {
      if (!gatedSpaceId) return
      trackEvent(SAFE_PRO_EVENTS.CHECKOUT_STARTED, props)
      const result = await trigger({
        spaceId: gatedSpaceId,
        paymentLinkId,
        returnUrl: getCheckoutReturnUrl(gatedSpaceId, returnPathname),
      })
      if (result.data) navigateTo(result.data.url)
    },
    [gatedSpaceId, returnPathname, trigger],
  )

  return { startCheckout, isRedirecting: isFetching, isError }
}
