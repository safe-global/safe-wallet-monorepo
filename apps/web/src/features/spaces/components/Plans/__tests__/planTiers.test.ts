import type { PlanGroup, PlanOffer } from '../../../hooks/billing/types'
import { PLAN_FEATURES, PLAN_TRIAL_HIGHLIGHTS } from '../fixtures'
import { buildPlanTiers, getChangeDirection, offersToTiers, seatsLabel, trialTiers } from '../planTiers'

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
const STARTER_TRIAL: PlanGroup = {
  name: 'Starter',
  offers: [offer({ paymentLinkId: 's2m', planName: 'Starter', seats: 2, price: 149, trialPeriodDays: 60 })],
}
const BUSINESS_TRIAL: PlanGroup = {
  name: 'Business',
  offers: [offer({ paymentLinkId: 'b10m', planName: 'Business', trialPeriodDays: 60 })],
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
    const [monthly, yearly] = offersToTiers([BUSINESS])

    expect(monthly).toMatchObject({ id: 'Business-month', billingCycle: 'month', features: PLAN_FEATURES.Business })
    expect(monthly.options.map((option) => [option.paymentLinkId, option.label, option.price])).toEqual([
      ['b10m', '10 Safe accounts', 499],
      ['b50m', '50 Safe accounts', 999],
    ])
    expect(yearly.options).toEqual([
      { paymentLinkId: 'b10y', priceId: 'price_b10y', label: '10 Safe accounts', price: 5389, originalPrice: 499 * 12 },
    ])
  })

  it('orders the offered plans and the static Enterprise card, without a current-plan card', () => {
    const starter: PlanGroup = {
      name: 'Starter',
      offers: [offer({ paymentLinkId: 's2m', planName: 'Starter', seats: 2, price: 149 })],
    }

    expect(buildPlanTiers([BUSINESS, starter]).map((tier) => [tier.name, tier.isCurrent ?? false])).toEqual([
      ['Starter', false],
      ['Business', false],
      ['Business', false],
      ['Enterprise', false],
    ])
  })

  it('tells an upgrade from a downgrade by monthly-equivalent price', () => {
    const [monthly, yearly] = offersToTiers([BUSINESS])
    const business = {
      name: 'Business',
      price: 499,
      currency: 'eur',
      billingCycle: 'month' as const,
      isTrialing: false,
    }
    const pickOf = (tier: typeof monthly, index: number) => ({ tier, option: tier.options[index] })

    expect(getChangeDirection({ ...business, price: 149 }, pickOf(monthly, 0))).toBe('upgrade')
    expect(getChangeDirection({ ...business, price: 999 }, pickOf(monthly, 0))).toBe('downgrade')
    expect(getChangeDirection(business, pickOf(monthly, 0))).toBe('change')
    expect(getChangeDirection(business, pickOf(yearly, 0))).toBe('downgrade')
    expect(getChangeDirection(undefined, pickOf(monthly, 0))).toBe('change')
  })

  it('keeps only monthly trial offers, trimmed to the modal highlights', () => {
    const tiers = trialTiers([BUSINESS_TRIAL, STARTER_TRIAL])

    expect(tiers.map((tier) => tier.name)).toEqual(['Starter', 'Business'])
    expect(tiers[1]).toMatchObject({ trialPeriodDays: 60, features: PLAN_TRIAL_HIGHLIGHTS.Business })
    expect(trialTiers([])).toEqual([])
  })
})
