import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { PlanGroup, PlanOffer } from '../../../hooks/billing/types'
import { PLAN_FEATURES, PLAN_TRIAL_HIGHLIGHTS } from '../fixtures'
import { buildPlanTiers, offersToTiers, seatsLabel, subscriptionToTier, trialTiers } from '../planTiers'

const offer = (overrides: Partial<PlanOffer> & Pick<PlanOffer, 'paymentLinkId' | 'planName'>): PlanOffer => ({
  seats: 10,
  price: 499,
  currency: 'eur',
  billingCycle: 'month',
  trialPeriodDays: null,
  ...overrides,
})

const BUSINESS: PlanGroup = {
  name: 'Business',
  offers: [
    offer({ paymentLinkId: 'b10m', planName: 'Business' }),
    offer({ paymentLinkId: 'b50m', planName: 'Business', seats: 50, price: 999 }),
    offer({ paymentLinkId: 'b10y', planName: 'Business', price: 5389, billingCycle: 'year' }),
  ],
}
const STARTER_TRIAL: PlanGroup = {
  name: 'Starter',
  offers: [offer({ paymentLinkId: 's2m', planName: 'Starter', seats: 2, price: 149, trialPeriodDays: 60 })],
}
const BUSINESS_TRIAL: PlanGroup = {
  name: 'Business',
  offers: [offer({ paymentLinkId: 'b10m', planName: 'Business', trialPeriodDays: 60 })],
}

const subscription = (plan: Partial<Subscription['plan']>): Subscription =>
  ({
    id: 'sub_1',
    status: 'active',
    plan: {
      id: 'price',
      name: 'Business',
      currentPrice: 499,
      originalPrice: null,
      currency: 'eur',
      billingCycle: 'month',
      features: [],
      ...plan,
    },
  }) as unknown as Subscription

describe('planTiers', () => {
  it.each([
    [10, '10 Safe accounts'],
    ['unlimited', 'Unlimited Safe accounts'],
    [null, 'Safe accounts'],
    [undefined, 'Safe accounts'],
  ] as const)('labels seats %p as %p', (seats, label) => {
    expect(seatsLabel(seats)).toBe(label)
  })

  it('splits a plan into one tier per cycle and prices the yearly option against twelve monthly payments', () => {
    const [monthly, yearly] = offersToTiers([BUSINESS])

    expect(monthly).toMatchObject({ id: 'Business-month', billingCycle: 'month', features: PLAN_FEATURES.Business })
    expect(monthly.options.map((option) => [option.paymentLinkId, option.label, option.price])).toEqual([
      ['b10m', '10 Safe accounts', 499],
      ['b50m', '50 Safe accounts', 999],
    ])
    expect(yearly.options).toEqual([
      { paymentLinkId: 'b10y', label: '10 Safe accounts', price: 5389, originalPrice: 499 * 12 },
    ])
  })

  it('rebuilds the current plan card from the subscription and the seats entitlement', () => {
    expect(subscriptionToTier(subscription({}), 10)).toMatchObject({
      id: 'current',
      name: 'Business',
      isCurrent: true,
      options: [{ paymentLinkId: null, label: '10 Safe accounts', price: 499, originalPrice: null }],
      features: PLAN_FEATURES.Business,
    })
    expect(subscriptionToTier(subscription({ features: ['Custom perk'] }), null)).toMatchObject({
      options: [expect.objectContaining({ label: 'Unlimited Safe accounts' })],
      features: ['Custom perk'],
    })
    expect(subscriptionToTier(subscription({ name: null }), undefined)).toMatchObject({
      name: 'Safe Pro',
      options: [expect.objectContaining({ label: 'Safe accounts' })],
    })
  })

  it('orders Starter, the current plan and Enterprise for the Plans page', () => {
    const starter: PlanGroup = {
      name: 'Starter',
      offers: [offer({ paymentLinkId: 's2m', planName: 'Starter', seats: 2, price: 149 })],
    }
    const tiers = buildPlanTiers({ paidPlans: [starter], subscription: subscription({}), seatsQuota: 10 })

    expect(tiers.map((tier) => [tier.name, tier.isCurrent ?? false])).toEqual([
      ['Starter', false],
      ['Business', true],
      ['Enterprise', false],
    ])
  })

  it('keeps only monthly trial offers, trimmed to the modal highlights', () => {
    const tiers = trialTiers([BUSINESS_TRIAL, STARTER_TRIAL])

    expect(tiers.map((tier) => tier.name)).toEqual(['Starter', 'Business'])
    expect(tiers[1]).toMatchObject({ trialPeriodDays: 60, features: PLAN_TRIAL_HIGHLIGHTS.Business })
    expect(trialTiers([])).toEqual([])
  })
})
