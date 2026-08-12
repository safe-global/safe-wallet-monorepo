import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { getBillingState, selectActiveSubscription } from '../subscriptionState'

const sub = (status: Subscription['status']): Subscription => ({ status }) as unknown as Subscription

describe('billing/subscriptionState', () => {
  describe('getBillingState', () => {
    it('returns none with no subscription and no activation', () => {
      expect(getBillingState(undefined, false)).toBe('none')
    })

    it('returns activating when returning from checkout with no subscription yet', () => {
      expect(getBillingState(undefined, true)).toBe('activating')
    })

    it.each<[Subscription['status'], ReturnType<typeof getBillingState>]>([
      ['active', 'active'],
      ['trialing', 'active'],
      ['past_due', 'payment_failed'],
      ['unpaid', 'payment_failed'],
      ['canceled', 'canceled'],
      ['incomplete_expired', 'canceled'],
      ['paused', 'canceled'],
      ['incomplete', 'activating'],
    ])('maps Stripe status %s to %s', (status, expected) => {
      expect(getBillingState(sub(status))).toBe(expected)
    })
  })

  describe('selectActiveSubscription', () => {
    it('returns undefined for an empty or missing list', () => {
      expect(selectActiveSubscription(undefined)).toBeUndefined()
      expect(selectActiveSubscription([])).toBeUndefined()
    })

    it('picks the first non-canceled subscription', () => {
      const canceled = sub('canceled')
      const active = sub('active')
      expect(selectActiveSubscription([canceled, active])).toBe(active)
    })

    it('returns undefined when all subscriptions are canceled', () => {
      expect(selectActiveSubscription([sub('canceled'), sub('incomplete_expired')])).toBeUndefined()
    })
  })
})
