import { ENTERPRISE_TIER, getCardFeaturesV2, getPlanContentV2, PLAN_CONTENT_V2 } from '../../planCatalog'
import type { CurrentPlan, PlanSeatOption, PlanTier } from '../../types'
import { _formatPerSafe, canManageV2, getPlanCtaV2, getPlanPriceV2, getTiersV2 } from '../planCardsV2'

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

describe('getPlanContentV2', () => {
  it('looks content up by plan name, ignoring names outside the catalog', () => {
    expect(getPlanContentV2('Business')).toBe(PLAN_CONTENT_V2.Business)
    expect(getPlanContentV2('Safe Pro')).toBeUndefined()
    expect(getPlanContentV2('toString')).toBeUndefined()
    expect(getCardFeaturesV2('Safe Pro')).toBeUndefined()
  })
})

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

describe('getTiersV2', () => {
  it('keeps the static Enterprise card for every other plan', () => {
    const tiers = [tier(), ENTERPRISE_TIER]
    expect(getTiersV2(tiers)).toEqual(tiers)
  })

  it('drops the static Enterprise card when Enterprise is the plan in force', () => {
    const currentEnterprise = tier({ id: 'current', name: 'Enterprise', isCurrent: true })
    expect(getTiersV2([tier(), currentEnterprise, ENTERPRISE_TIER])).toEqual([tier(), currentEnterprise])
  })
})

describe('canManageV2', () => {
  it.each([
    { canManage: true, current: undefined, expected: true },
    { canManage: false, current: currentPlan({ isTrialing: true, hasPaymentMethod: true }), expected: true },
    { canManage: false, current: currentPlan({ isTrialing: true }), expected: false },
    { canManage: false, current: currentPlan(), expected: false },
    { canManage: undefined, current: undefined, expected: false },
  ])('is $expected for canManage $canManage and plan $current', ({ canManage, current, expected }) => {
    expect(canManageV2(canManage, current)).toBe(expected)
  })
})

describe('getPlanPriceV2', () => {
  it('shows the monthly total', () => {
    expect(getPlanPriceV2(tier(), option({ price: 669 }))).toEqual({
      headline: '€669',
      suffix: '/mo',
      line: 'Billed monthly · excl. VAT',
      perSafe: '€33.45 per Safe account/mo',
    })
  })

  it('shows the yearly total on a yearly offer, with the per-Safe price as a monthly equivalent', () => {
    expect(getPlanPriceV2(tier({ billingCycle: 'year' }), option({ price: 17_424 }))).toEqual({
      headline: '€17,424',
      suffix: '/yr',
      line: 'Billed yearly · excl. VAT',
      perSafe: '€72.60 per Safe account/mo',
    })
  })

  it('leaves out the per-Safe price when the seat count is unknown', () => {
    expect(getPlanPriceV2(tier(), option({ price: 669, seats: null })).perSafe).toBeUndefined()
  })

  it('shows custom pricing without a price', () => {
    expect(getPlanPriceV2(ENTERPRISE_TIER, ENTERPRISE_TIER.options[0])).toEqual({
      headline: 'Custom',
      suffix: 'Annual term',
      line: 'Pricing by agreement · Billed annually',
    })
  })
})

describe('_formatPerSafe', () => {
  it.each([
    [189, 'month', 2, '€94.50', 189],
    [669, 'month', 5, '€133.80', 669],
    [1099, 'month', 10, '€109.90', 1099],
    [1669, 'month', 20, '€83.45', 1669],
    [17_424, 'year', 20, '€72.60', 1452],
  ] as const)(
    '%s/%s over %s Safes is %s, which multiplies back to the monthly total',
    (price, cycle, seats, shown, monthly) => {
      expect(_formatPerSafe(price, cycle, seats, 'eur')).toBe(shown)
      expect(Number(shown.slice(1)) * seats).toBeCloseTo(monthly, 2)
    },
  )

  it('rounds to the nearest cent when the total does not split evenly', () => {
    expect(_formatPerSafe(1973, 'year', 2, 'eur')).toBe('€82.21')
  })

  it('drops the cents when the price per Safe is whole', () => {
    expect(_formatPerSafe(200, 'month', 2, 'eur')).toBe('€100')
  })
})
