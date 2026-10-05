import { ENTERPRISE_TIER } from '../../planCatalog'
import type { CurrentPlan, PlanSeatOption, PlanTier } from '../../types'
import { getCardSavingV2, getPlanCtaV2, getPlanPriceV2, getYearlySavingV2 } from '../planCardsV2'

const option = (overrides: Partial<PlanSeatOption> = {}): PlanSeatOption => ({
  paymentLinkId: 'pl_b20m',
  priceId: 'price_b20m',
  label: '20 Safe accounts',
  seats: 20,
  price: 1669,
  originalPrice: null,
  ...overrides,
})

const tier = (overrides: Partial<PlanTier> = {}): PlanTier => ({
  id: 'Business-month',
  name: 'Business',
  currency: 'eur',
  billingCycle: 'month',
  options: [option()],
  features: [],
  ...overrides,
})

const currentPlan = (overrides: Partial<CurrentPlan> = {}): CurrentPlan => ({
  name: 'Business',
  price: 1669,
  currency: 'eur',
  billingCycle: 'month',
  isTrialing: false,
  periodEndsAt: null,
  ...overrides,
})

const currentBusiness = tier({ id: 'current', isCurrent: true, currentPriceId: 'price_b20m' })

describe('getPlanCtaV2', () => {
  it('shows the plan in force as the greyed-out current plan', () => {
    expect(getPlanCtaV2({ tier: currentBusiness, option: option() }, currentPlan())).toEqual({
      kind: 'current',
      label: 'Current plan',
    })
    expect(
      getPlanCtaV2(
        { tier: currentBusiness, option: option() },
        currentPlan({ isTrialing: true, hasPaymentMethod: true }),
      ),
    ).toEqual({ kind: 'current', label: 'Current plan' })
  })

  it('asks for a payment method during free access without one', () => {
    expect(getPlanCtaV2({ tier: currentBusiness, option: option() }, currentPlan({ isTrialing: true }))).toEqual({
      kind: 'billing',
      label: 'Add payment method',
    })
  })

  it('keeps the upgrade and switch wording of the launch cards', () => {
    const starter = tier({
      id: 'Starter-month',
      name: 'Starter',
      options: [option({ priceId: 'price_s2m', price: 189 })],
    })
    expect(getPlanCtaV2({ tier: starter, option: starter.options[0] }, currentPlan())).toMatchObject({
      kind: 'change',
      label: 'Switch to Starter',
    })
    expect(
      getPlanCtaV2({ tier: tier(), option: option() }, currentPlan({ name: 'Starter', price: 189 })),
    ).toMatchObject({ kind: 'change', label: 'Upgrade to Business' })
  })

  it('sends Enterprise to sales, or to the account team once it is the plan in force', () => {
    expect(getPlanCtaV2({ tier: ENTERPRISE_TIER, option: ENTERPRISE_TIER.options[0] }, currentPlan())).toEqual({
      kind: 'sales',
      label: 'Talk to sales',
    })
    const currentEnterprise = tier({ id: 'current', name: 'Enterprise', isCurrent: true, currentPriceId: 'price_b20m' })
    expect(getPlanCtaV2({ tier: currentEnterprise, option: option() }, currentPlan({ name: 'Enterprise' }))).toEqual({
      kind: 'account-team',
      label: 'Change via your account team',
    })
  })
})

describe('getPlanPriceV2', () => {
  it('shows the monthly total', () => {
    expect(getPlanPriceV2(tier(), option({ price: 669 }))).toEqual({
      headline: '€669',
      suffix: '/mo',
    })
  })

  it('shows the yearly total on a yearly offer', () => {
    expect(getPlanPriceV2(tier({ billingCycle: 'year' }), option({ price: 17_424 }))).toEqual({
      headline: '€17,424',
      suffix: '/yr',
    })
  })

  it('shows custom pricing without a price', () => {
    expect(getPlanPriceV2(ENTERPRISE_TIER, ENTERPRISE_TIER.options[0])).toEqual({
      headline: 'Custom',
      suffix: 'Annual term',
    })
  })
})

describe('getYearlySavingV2', () => {
  it('shows what a year saves against twelve monthly payments', () => {
    expect(getYearlySavingV2(1669 * 12, 17_990, 'eur')).toEqual({ amount: '€2,038', percent: '10.2%' })
    expect(getYearlySavingV2(189 * 12, 1990, 'eur')).toEqual({ amount: '€278', percent: '12.3%' })
  })

  it('shows nothing without both prices or without a saving', () => {
    expect(getYearlySavingV2(null, 17_990, 'eur')).toBeUndefined()
    expect(getYearlySavingV2(20_028, undefined, 'eur')).toBeUndefined()
    expect(getYearlySavingV2(12_000, 12_000, 'eur')).toBeUndefined()
  })
})

describe('getCardSavingV2', () => {
  const yearlyTier = tier({
    id: 'Business-year',
    billingCycle: 'year',
    options: [option({ price: 17_990, originalPrice: 20_028 })],
  })

  it('shows a yearly card its own saving', () => {
    expect(getCardSavingV2(yearlyTier, yearlyTier.options[0], undefined)).toEqual({
      amount: '€2,038',
      percent: '10.2%',
    })
  })

  it('takes the monthly price from the current plan card when the offers leave it out', () => {
    const yearlyWithoutReference = option({ price: 17_990, originalPrice: null })
    const currentMonthly = tier({ id: 'current', isCurrent: true, options: [option({ price: 1669 })] })

    expect(getCardSavingV2(yearlyTier, yearlyWithoutReference, currentMonthly)).toEqual({
      amount: '€2,038',
      percent: '10.2%',
    })
  })

  it('shows a monthly card what the same Safe count saves yearly', () => {
    expect(getCardSavingV2(tier(), option(), yearlyTier)).toEqual({ amount: '€2,038', percent: '10.2%' })
    expect(getCardSavingV2(tier(), option({ label: '5 Safe accounts' }), yearlyTier)).toBeUndefined()
  })
})
