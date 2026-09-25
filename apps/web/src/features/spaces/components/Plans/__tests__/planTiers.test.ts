import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { PlanGroup, PlanOffer } from '../../../hooks/billing/types'
import { PLAN_FEATURES } from '../planCatalog'
import {
  buildPlanTiers,
  claimTiers,
  getChangeDirection,
  getPlanCta,
  _offersToTiers,
  seatsLabel,
  _subscriptionToTier,
  toCurrentPlan,
} from '../planTiers'
import type { CurrentPlan, PlanSummary } from '../types'

const offer = (overrides: Partial<PlanOffer> & Pick<PlanOffer, 'paymentLinkId' | 'planName'>): PlanOffer => ({
  priceId: `price_${overrides.paymentLinkId}`,
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
const STARTER: PlanGroup = {
  name: 'Starter',
  offers: [offer({ paymentLinkId: 's2m', planName: 'Starter', seats: 2, price: 149 })],
}
const STARTER_TRIAL: PlanGroup = {
  name: 'Starter',
  offers: [offer({ paymentLinkId: 's2m', planName: 'Starter', seats: 2, price: 149, trialPeriodDays: 60 })],
}
const BUSINESS_TRIAL: PlanGroup = {
  name: 'Business',
  offers: [offer({ paymentLinkId: 'b10m', planName: 'Business', trialPeriodDays: 60 })],
}

const subscription = (plan: Partial<Subscription['plan']> = {}): Subscription =>
  ({
    id: 'sub_1',
    status: 'active',
    plan: {
      id: 'price_b10m',
      name: 'Business',
      currentPrice: 499,
      originalPrice: null,
      currency: 'eur',
      billingCycle: 'month',
      features: [],
      ...plan,
    },
  }) as unknown as Subscription

const businessPlan: CurrentPlan = {
  name: 'Business',
  price: 499,
  currency: 'eur',
  billingCycle: 'month',
  isTrialing: false,
  periodEndsAt: null,
}

describe('planTiers', () => {
  it.each([
    [10, '10 Safe accounts'],
    ['unlimited', 'Unlimited Safe accounts'],
    [null, 'Safe accounts'],
  ] as const)('labels seats %p as %p', (seats, label) => {
    expect(seatsLabel(seats)).toBe(label)
  })

  it('splits a plan into one tier per cycle and prices the yearly option against twelve monthly payments', () => {
    const [monthly, yearly] = _offersToTiers([BUSINESS])

    expect(monthly).toMatchObject({ id: 'Business-month', billingCycle: 'month', features: PLAN_FEATURES.Business })
    expect(monthly.options.map((option) => [option.paymentLinkId, option.label, option.price])).toEqual([
      ['b10m', '10 Safe accounts', 499],
      ['b50m', '50 Safe accounts', 999],
    ])
    expect(yearly.options).toEqual([
      {
        paymentLinkId: 'b10y',
        priceId: 'price_b10y',
        label: '10 Safe accounts',
        seats: 10,
        price: 5389,
        originalPrice: 499 * 12,
      },
    ])
  })

  it('rebuilds the current plan card from the subscription and the seats entitlement', () => {
    expect(_subscriptionToTier(subscription(), 20)).toMatchObject({
      id: 'current',
      name: 'Business',
      isCurrent: true,
      options: [{ paymentLinkId: null, priceId: 'price_b10m', label: '20 Safe accounts', price: 499 }],
      features: PLAN_FEATURES.Business,
    })
    expect(_subscriptionToTier(subscription({ features: ['Custom perk'] }), null)).toMatchObject({
      options: [expect.objectContaining({ label: 'Unlimited Safe accounts' })],
      features: ['Custom perk'],
    })
    expect(_subscriptionToTier(subscription({ name: null }), undefined)).toMatchObject({
      name: 'Safe Pro',
      options: [expect.objectContaining({ label: 'Safe accounts' })],
    })
  })

  it('takes the current seats from the subscription tag before the entitlements quota', () => {
    const plan: PlanSummary = { name: 'Business', status: 'active', periodEndsAt: null, daysLeft: null }
    const tagged = { ...subscription(), metadata: { FEATURE_SAFE_SEATS: '5' } } as unknown as Subscription
    expect(_subscriptionToTier(tagged, 10).options[0]).toMatchObject({ label: '5 Safe accounts', seats: 5 })
    expect(toCurrentPlan(tagged, plan, false, 10).seatsLabel).toBe('5 Safe accounts')
    expect(toCurrentPlan(subscription(), plan, false, 10).seatsLabel).toBe('10 Safe accounts')
  })

  it('orders the offered plans, the current plan and the static Enterprise card', () => {
    const withCurrent = buildPlanTiers([STARTER], { subscription: subscription(), seatsQuota: 20 })
    expect(withCurrent.map((tier) => [tier.name, tier.isCurrent ?? false])).toEqual([
      ['Starter', false],
      ['Business', true],
      ['Enterprise', false],
    ])

    expect(buildPlanTiers([BUSINESS, STARTER]).map((tier) => tier.name)).toEqual([
      'Starter',
      'Business',
      'Business',
      'Enterprise',
    ])
  })

  it('folds the other seat sizes of the current plan into its card and drops its duplicate cards', () => {
    const tiers = buildPlanTiers([BUSINESS, STARTER], {
      subscription: subscription({ id: 'price_b20m' }),
      seatsQuota: 20,
    })

    expect(tiers.map((tier) => [tier.name, tier.billingCycle, tier.isCurrent ?? false])).toEqual([
      ['Starter', 'month', false],
      ['Business', 'year', false],
      ['Business', 'month', true],
      ['Enterprise', null, false],
    ])
    const business = tiers[2]
    expect(business.currentPriceId).toBe('price_b20m')
    expect(business.options.map((option) => [option.priceId, option.seats, option.paymentLinkId])).toEqual([
      ['price_b10m', 10, 'b10m'],
      ['price_b20m', 20, null],
      ['price_b50m', 50, 'b50m'],
    ])
  })

  it('turns another seat size of the current plan into a change, and the current one into managing it', () => {
    const [, business] = buildPlanTiers([BUSINESS], {
      subscription: subscription({ id: 'price_b20m' }),
      seatsQuota: 20,
    })
    const [smaller, current, bigger] = business.options

    expect(getPlanCta({ tier: business, option: current }, businessPlan)).toEqual({
      kind: 'manage',
      label: 'Manage plan',
    })
    expect(getPlanCta({ tier: business, option: bigger }, { ...businessPlan, price: 499 })).toEqual({
      kind: 'change',
      direction: 'upgrade',
      label: 'Upgrade to 50 Safe accounts',
    })
    expect(getPlanCta({ tier: business, option: smaller }, { ...businessPlan, price: 999 })).toEqual({
      kind: 'change',
      direction: 'downgrade',
      label: 'Switch to 10 Safe accounts',
    })
  })

  it('words the same plan on the other billing cycle by seats, like the current card', () => {
    const tiers = buildPlanTiers([BUSINESS], { subscription: subscription({ id: 'price_b20m' }), seatsQuota: 20 })
    const yearly = tiers.find((tier) => tier.billingCycle === 'year')!
    expect(yearly).toMatchObject({ name: 'Business', billingCycle: 'year' })
    expect(yearly.isCurrent).toBeFalsy()

    expect(getPlanCta({ tier: yearly, option: yearly.options[0] }, businessPlan)).toEqual({
      kind: 'change',
      direction: 'downgrade',
      label: 'Switch to 10 Safe accounts',
    })
    expect(getPlanCta({ tier: yearly, option: yearly.options[0] }, { ...businessPlan, price: 149 })).toEqual({
      kind: 'change',
      direction: 'upgrade',
      label: 'Upgrade to 10 Safe accounts',
    })
  })

  it('tells an upgrade from a downgrade by monthly-equivalent price', () => {
    const [monthly, yearly] = _offersToTiers([BUSINESS])
    const pickOf = (tier: typeof monthly, index: number) => ({ tier, option: tier.options[index] })

    expect(getChangeDirection({ ...businessPlan, price: 149 }, pickOf(monthly, 0))).toBe('upgrade')
    expect(getChangeDirection({ ...businessPlan, price: 999 }, pickOf(monthly, 0))).toBe('downgrade')
    expect(getChangeDirection(businessPlan, pickOf(monthly, 0))).toBe('change')
    expect(getChangeDirection(businessPlan, pickOf(yearly, 0))).toBe('downgrade')
    expect(getChangeDirection(undefined, pickOf(monthly, 0))).toBe('change')
  })

  it('picks the card CTA from the plan in force', () => {
    const [starter, current, enterprise] = buildPlanTiers([STARTER], { subscription: subscription(), seatsQuota: 20 })
    const pick = (tier: typeof starter) => ({ tier, option: tier.options[0] })

    expect(getPlanCta(pick(current), businessPlan)).toEqual({ kind: 'manage', label: 'Manage plan' })
    expect(getPlanCta(pick(current), { ...businessPlan, isTrialing: true })).toEqual({
      kind: 'billing',
      label: 'Add payment method',
    })
    expect(getPlanCta(pick(current), { ...businessPlan, isTrialing: true, hasPaymentMethod: true })).toEqual({
      kind: 'manage',
      label: 'Manage plan',
    })
    expect(getPlanCta(pick(starter), businessPlan)).toEqual({
      kind: 'change',
      direction: 'downgrade',
      label: 'Switch to Starter',
    })
    expect(getPlanCta(pick(starter), { ...businessPlan, name: 'Free', price: 49 })).toEqual({
      kind: 'change',
      direction: 'upgrade',
      label: 'Upgrade to Starter',
    })
    expect(getPlanCta(pick(starter), undefined)).toEqual({ kind: 'subscribe', label: 'Continue with Starter' })
    expect(getPlanCta(pick(starter), undefined, 'Business')).toEqual({
      kind: 'change',
      direction: 'change',
      label: 'Switch to Starter',
    })
    expect(getPlanCta(pick(starter), undefined, 'Starter')).toEqual({
      kind: 'subscribe',
      label: 'Continue with Starter',
    })
    expect(getPlanCta(pick(enterprise), businessPlan)).toEqual({ kind: 'sales', label: 'Talk to sales' })
  })

  it('leads the claim card with the seat count and then the plan’s own selling points', () => {
    const [starter, business] = claimTiers([BUSINESS_TRIAL, STARTER_TRIAL])

    expect(starter.features[0]).toBe('2 Safe accounts')
    expect(business.features).toEqual(['10 Safe accounts', ...PLAN_FEATURES.Business])
    expect(business.options[0].seats).toBe(10)
  })

  it('prefers the selling points Stripe carries over the static copy, per offer and for the current plan', () => {
    const stripeBusiness: PlanGroup = {
      name: 'Business',
      offers: [offer({ paymentLinkId: 'b10m', planName: 'Business', features: ['From Stripe', 'In order'] })],
    }
    const [tier] = _offersToTiers([stripeBusiness])
    expect(tier.features).toEqual(['From Stripe', 'In order'])
    expect(tier.options[0].features).toEqual(['From Stripe', 'In order'])

    const tagged = {
      ...subscription({ id: 'price_b20m' }),
      metadata: { planDescriptions: JSON.stringify(['Sub perk']) },
    } as unknown as Subscription
    expect(_subscriptionToTier(tagged, 20).features).toEqual(['Sub perk'])

    const [merged] = buildPlanTiers([stripeBusiness], {
      subscription: subscription({ id: 'price_b20m' }),
      seatsQuota: 20,
    })
    expect(merged.isCurrent).toBe(true)
    expect(merged.features).toEqual(['From Stripe', 'In order'])
  })
})
