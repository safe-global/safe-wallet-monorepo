import type { Subscription, SubscriptionPlan } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { Builder } from '@/tests/Builder'
import {
  getDaysLeft,
  getPlanStatus,
  getSubscriptionEndedAt,
  getSubscriptionFeatures,
  getSubscriptionPeriodEnd,
  getSubscriptionPlanName,
  getSubscriptionSeats,
  trialLabel,
  isPlanChangeable,
  selectCurrentSubscription,
  selectLatestSubscription,
} from '../subscription'

const plan = (override: Partial<SubscriptionPlan> = {}): SubscriptionPlan =>
  Builder.new<SubscriptionPlan>().with({ id: 'plan', name: 'Business', features: [] }).with(override).build()

const sub = (id: string, status: Subscription['status'], override: Partial<Subscription> = {}): Subscription =>
  Builder.new<Subscription>().with({ id, status, plan: plan() }).with(override).build()

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
    const older = sub('old', 'canceled', { createdAt: 1, cancelledAt: 1_700_000_000 })
    const newer = sub('new', 'canceled', { createdAt: 2, cancelledAt: null, currentPeriodEnd: 1_765_000_000 })

    expect(selectLatestSubscription([older, newer])).toBe(newer)
    expect(selectLatestSubscription(undefined)).toBeUndefined()
    expect(getSubscriptionEndedAt(older)).toBe(1_700_000_000_000)
    expect(getSubscriptionEndedAt(newer)).toBe(1_765_000_000_000)
    expect(getSubscriptionEndedAt({ ...newer, currentPeriodEnd: null })).toBeNull()
    expect(getSubscriptionEndedAt(undefined)).toBeNull()
  })

  it('reads the plan name from the plan or from the Stripe metadata, and the period end as an ISO date', () => {
    const tagged = sub('a', 'trialing', {
      plan: plan({ id: 'p', name: undefined }),
      metadata: { planName: 'Business' },
      currentPeriodEnd: 1_794_664_499,
    })

    expect(getSubscriptionPlanName(sub('a', 'active'))).toBe('Business')
    expect(getSubscriptionPlanName(tagged)).toBe('Business')
    expect(getSubscriptionPlanName({ ...tagged, metadata: null })).toBeNull()
    expect(getSubscriptionPlanName(undefined)).toBeNull()
    expect(getSubscriptionPeriodEnd(tagged)).toBe(new Date(1_794_664_499 * 1000).toISOString())
    expect(getSubscriptionPeriodEnd(sub('a', 'active'))).toBeNull()
  })

  it('reads the seat quota the CGW copies from the payment link onto the subscription', () => {
    const seats = (value: unknown) => sub('a', 'active', { metadata: { FEATURE_SAFE_SEATS: value } })
    expect(getSubscriptionSeats(seats('20'))).toBe(20)
    expect(getSubscriptionSeats(seats('unlimited'))).toBe('unlimited')
    expect(getSubscriptionSeats(seats('many'))).toBeNull()
    expect(getSubscriptionSeats(seats(20))).toBeNull()
    expect(getSubscriptionSeats(sub('a', 'active'))).toBeNull()
  })

  it('reads the selling points from the plan, else from the Stripe metadata', () => {
    const planDescriptions = JSON.stringify(['From metadata'])
    expect(getSubscriptionFeatures(sub('a', 'active', { plan: plan({ features: ['From plan'] }) }))).toEqual([
      'From plan',
    ])
    expect(getSubscriptionFeatures(sub('a', 'active', { metadata: { planDescriptions } }))).toEqual(['From metadata'])
    expect(getSubscriptionFeatures(sub('a', 'active'))).toEqual([])
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
