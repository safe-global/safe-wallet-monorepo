import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { getPlanStatus, selectCurrentSubscription } from '../subscription'

const sub = (id: string, status: Subscription['status']): Subscription =>
  ({ id, status, plan: { id: 'plan', name: 'Business' } }) as unknown as Subscription

describe('subscription', () => {
  it('prefers the subscription holding the slot over historical entries', () => {
    const active = sub('active', 'active')
    expect(selectCurrentSubscription([sub('old', 'canceled'), active])).toBe(active)
    expect(selectCurrentSubscription([sub('old', 'canceled'), sub('trial', 'trialing')])?.id).toBe('trial')
  })

  it('falls back to a non-canceled subscription so a failed renewal is still surfaced', () => {
    expect(selectCurrentSubscription([sub('old', 'canceled'), sub('due', 'past_due')])?.id).toBe('due')
    expect(selectCurrentSubscription([sub('old', 'canceled'), sub('paused', 'paused')])).toBeUndefined()
    expect(selectCurrentSubscription(undefined)).toBeUndefined()
  })

  it.each([
    [undefined, 'none'],
    [sub('a', 'trialing'), 'trialing'],
    [sub('a', 'active'), 'active'],
    [sub('a', 'past_due'), 'payment_failed'],
    [sub('a', 'unpaid'), 'payment_failed'],
    [sub('a', 'canceled'), 'canceled'],
    [sub('a', 'incomplete_expired'), 'canceled'],
    [sub('a', 'paused'), 'canceled'],
    [sub('a', 'incomplete'), 'pending'],
  ])('derives the plan status for %p', (subscription, expected) => {
    expect(getPlanStatus(subscription)).toBe(expected)
  })
})
