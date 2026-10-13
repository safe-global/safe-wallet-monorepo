import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { RootState } from '@/store/index'
import { cgwApi as billingApi } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { BillingPeriod, MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { PAID_LINKS, SPACE_ID } from '../../components/Plans/plans.fixtures'
import { checkoutTrackingListener } from '../checkoutTrackingListener'

jest.mock('@/services/analytics', () => ({ ...jest.requireActual('@/services/analytics'), trackEvent: jest.fn() }))

const checkout = (requestStatus: 'fulfilled' | 'rejected', paymentLinkId: string) => ({
  type: `${billingApi.reducerPath}/executeQuery/${requestStatus}`,
  meta: {
    requestStatus,
    arg: { type: 'query', endpointName: 'billingGetCheckoutUrlV1', originalArgs: { spaceId: SPACE_ID, paymentLinkId } },
  },
})

describe('checkoutTrackingListener', () => {
  const listenerMiddleware = createListenerMiddleware<RootState>()
  const getState = jest.fn(() => ({}) as RootState)
  const run = (action: ReturnType<typeof checkout>) =>
    listenerMiddleware.middleware({ getState, dispatch: jest.fn() })(jest.fn())(action)

  beforeEach(() => {
    listenerMiddleware.clearListeners()
    checkoutTrackingListener(listenerMiddleware)
    jest.clearAllMocks()
    jest
      .spyOn(billingApi.endpoints.billingGetSpacePaymentLinksV1, 'select')
      .mockReturnValue(() => ({ data: PAID_LINKS }) as never)
  })

  it('tracks a started checkout with the plan behind the link', () => {
    run(checkout('fulfilled', 'pl_Business_10_month'))

    expect(trackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.CHECKOUT_STARTED, {
      [MixpanelEventParams.TARGET_PLAN]: 'business',
      [MixpanelEventParams.SEATS]: 10,
      [MixpanelEventParams.BILLING_PERIOD]: BillingPeriod.MONTHLY,
    })
  })

  it('does not track a checkout that failed', () => {
    run(checkout('rejected', 'pl_Business_10_month'))

    expect(trackEvent).not.toHaveBeenCalled()
  })
})
