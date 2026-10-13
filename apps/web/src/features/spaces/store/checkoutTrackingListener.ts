import type { listenerMiddlewareInstance } from '@/store/index'
import { cgwApi as billingApi } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { groupOffersByPlan } from '../hooks/billing/paymentLinks'
import { pickProps } from '../components/Plans/planTiers'

export const checkoutTrackingListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  const endpoints = billingApi?.endpoints
  // Tests that mock the billing module leave no endpoint to watch.
  if (!endpoints) return

  listenerMiddleware.startListening({
    matcher: endpoints.billingGetCheckoutUrlV1.matchFulfilled,
    effect: (action, { getState }) => {
      const { spaceId, paymentLinkId } = action.meta.arg.originalArgs
      const selectLinks = endpoints.billingGetSpacePaymentLinksV1.select({ spaceId })
      // RootState types the shared gateway reducer without the billing tags; the cache entry is the same.
      const links = selectLinks(getState() as unknown as Parameters<typeof selectLinks>[0]).data ?? []
      const offer = groupOffersByPlan(links)
        .flatMap((plan) => plan.offers)
        .find((candidate) => candidate.paymentLinkId === paymentLinkId)
      const plan = offer
        ? pickProps({
            tier: { name: offer.planName, billingCycle: offer.billingCycle },
            option: { seats: typeof offer.seats === 'number' ? offer.seats : null },
          })
        : {}
      trackEvent(SAFE_PRO_EVENTS.CHECKOUT_STARTED, plan)
    },
  })
}
