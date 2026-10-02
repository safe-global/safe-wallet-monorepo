import { ENTERPRISE_TIER } from '../../planCatalog'
import type { CurrentPlan, PlanSeatOption, PlanTier } from '../../types'
import { getPlanCtaV2, getPlanPriceV2 } from '../planCardsV2'

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
      line: 'Billed monthly · excl. VAT',
    })
  })

  it('shows the yearly total on a yearly offer', () => {
    expect(getPlanPriceV2(tier({ billingCycle: 'year' }), option({ price: 17_424 }))).toEqual({
      headline: '€17,424',
      suffix: '/yr',
      line: 'Billed yearly · excl. VAT',
    })
  })

  it('shows custom pricing without a price', () => {
    expect(getPlanPriceV2(ENTERPRISE_TIER, ENTERPRISE_TIER.options[0])).toEqual({
      headline: 'Custom',
      suffix: 'Annual term',
      line: 'Pricing by agreement · Billed annually',
    })
  })
})
