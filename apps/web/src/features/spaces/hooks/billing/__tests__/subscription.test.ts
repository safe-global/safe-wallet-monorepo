import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import {
  getDaysLeft,
  getPlanStatus,
  getSubscriptionEndedAt,
  getSubscriptionPeriodEnd,
  getSubscriptionPlanName,
  getSubscriptionSeats,
  trialLabel,
  isPlanChangeable,
  selectCurrentSubscription,
  selectLatestSubscription,
} from '../subscription'

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

  it.each(['none', 'pending', 'payment_failed', 'canceled'] as const)('cannot change plan while %s', (status) => {
    expect(isPlanChangeable(status)).toBe(false)
  })

  it.each(['active', 'trialing'] as const)('can change plan while %s', (status) => {
    expect(isPlanChangeable(status)).toBe(true)
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

  it('counts the days left until the period ends, rounding up and never below zero', () => {
    const now = Date.UTC(2026, 10, 22, 12)
    expect(getDaysLeft('2026-12-06T00:00:00Z', now)).toBe(14)
    expect(getDaysLeft('2026-11-22T13:00:00Z', now)).toBe(1)
    expect(getDaysLeft('2026-11-01T00:00:00Z', now)).toBe(0)
    expect(getDaysLeft(null, now)).toBeNull()
    expect(getDaysLeft('not a date', now)).toBeNull()
  })

  it('picks the most recently created subscription and reads when it stopped covering the Workspace', () => {
    const older = { ...sub('old', 'canceled'), createdAt: 1, cancelledAt: 1_700_000_000 }
    const newer = { ...sub('new', 'canceled'), createdAt: 2, cancelledAt: null, currentPeriodEnd: 1_765_000_000 }

    expect(selectLatestSubscription([older, newer])).toBe(newer)
    expect(selectLatestSubscription(undefined)).toBeUndefined()
    expect(getSubscriptionEndedAt(older)).toBe(1_700_000_000_000)
    expect(getSubscriptionEndedAt(newer)).toBe(1_765_000_000_000)
    expect(getSubscriptionEndedAt({ ...newer, currentPeriodEnd: null })).toBeNull()
    expect(getSubscriptionEndedAt(undefined)).toBeNull()
  })

  it('reads the plan name from the plan or from the Stripe metadata, and the period end as an ISO date', () => {
    const tagged = {
      ...sub('a', 'trialing'),
      plan: { id: 'p' },
      metadata: { planName: 'Business' },
      currentPeriodEnd: 1_794_664_499,
    }

    expect(getSubscriptionPlanName(sub('a', 'active'))).toBe('Business')
    expect(getSubscriptionPlanName(tagged as unknown as Subscription)).toBe('Business')
    expect(getSubscriptionPlanName({ ...tagged, metadata: null } as unknown as Subscription)).toBeNull()
    expect(getSubscriptionPlanName(undefined)).toBeNull()
    expect(getSubscriptionPeriodEnd(tagged as unknown as Subscription)).toBe(
      new Date(1_794_664_499 * 1000).toISOString(),
    )
    expect(getSubscriptionPeriodEnd(sub('a', 'active'))).toBeNull()
  })

  it('reads the seat quota the CGW copies from the payment link onto the subscription', () => {
    const seats = (value: string) => ({ ...sub('a', 'active'), metadata: { FEATURE_SAFE_SEATS: value } })
    expect(getSubscriptionSeats(seats('20') as unknown as Subscription)).toBe(20)
    expect(getSubscriptionSeats(seats('unlimited') as unknown as Subscription)).toBe('unlimited')
    expect(getSubscriptionSeats(seats('many') as unknown as Subscription)).toBeNull()
    expect(getSubscriptionSeats(sub('a', 'active'))).toBeNull()
  })

  it.each([
    [null, 'Free access'],
    [20, 'Free access'],
    [14, 'Free access · 14 days left'],
    [1, 'Free access · 1 day left'],
    [0, 'Free access · 0 days left'],
  ])('labels a trial with %p days left as %p', (daysLeft, label) => {
    expect(trialLabel(daysLeft)).toBe(label)
  })
})
