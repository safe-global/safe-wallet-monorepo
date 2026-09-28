import { _roundHalfUp, formatMinorAmount, getPerSafeMonthlyMinor, getPlanPriceV2, toMinorUnits } from '../perSafePrice'
import type { PlanSeatOption, PlanTier } from '../types'

const tier = (overrides: Partial<PlanTier> = {}): PlanTier => ({
  id: 'Business-month',
  name: 'Business',
  currency: 'eur',
  billingCycle: 'month',
  options: [],
  features: [],
  ...overrides,
})

const option = (overrides: Partial<PlanSeatOption> = {}): PlanSeatOption => ({
  paymentLinkId: 'pl',
  priceId: 'price',
  label: '2 Safe accounts',
  seats: 2,
  price: null,
  originalPrice: null,
  ...overrides,
})

describe('perSafePrice', () => {
  it.each([
    [10, 4, 3],
    [9, 4, 2],
    [5, 2, 3],
    [1, 3, 0],
    [0, 7, 0],
  ])('rounds %i / %i half up to %i', (numerator, denominator, expected) => {
    expect(_roundHalfUp(numerator, denominator)).toBe(expected)
  })

  it.each([
    [18_900, 2, 'month', 9_450],
    [166_900, 20, 'month', 8_345],
    [14_900, 1, 'month', 14_900],
    [197_400, 2, 'year', 8_225],
    [1_502_100, 20, 'year', 6_259],
  ] as const)(
    'prices %i minor units over %i Safes per %s at %i per Safe per month',
    (total, safes, cycle, expected) => {
      expect(getPerSafeMonthlyMinor(total, safes, cycle)).toBe(expected)
    },
  )

  it.each([
    [9_450, 'eur', '€94.50'],
    [8_345, 'eur', '€83.45'],
    [14_900, 'eur', '€149'],
    [166_900, 'eur', '€1,669'],
    [9_450, 'usd', '$94.50'],
  ])('formats %i %s as %s', (amount, currency, expected) => {
    expect(formatMinorAmount(amount, currency)).toBe(expected)
  })

  it('converts whole units to minor units without float drift', () => {
    expect(toMinorUnits(1669, 'eur')).toBe(166_900)
    expect(toMinorUnits(94.5, 'eur')).toBe(9_450)
    expect(toMinorUnits(0.29, 'usd')).toBe(29)
  })

  it('shows the per-Safe price and the monthly amount charged', () => {
    expect(getPlanPriceV2(tier(), option({ price: 189, amountMinor: 18_900 }))).toEqual({
      headline: '€94.50',
      suffix: '/Safe/mo',
      line: '€189/mo billed monthly · excl. VAT',
    })
    expect(getPlanPriceV2(tier(), option({ seats: 20, price: 1669, amountMinor: 166_900 }))).toEqual({
      headline: '€83.45',
      suffix: '/Safe/mo',
      line: '€1,669/mo billed monthly · excl. VAT',
    })
  })

  it('shows the yearly total as charged, next to its monthly equivalent', () => {
    expect(
      getPlanPriceV2(tier({ billingCycle: 'year' }), option({ seats: 20, price: 15_021, amountMinor: 1_502_100 })),
    ).toEqual({
      headline: '€62.59',
      suffix: '/Safe/mo',
      line: '€1,251.75/mo · €15,021 billed yearly',
    })
  })

  it('prices in the tier currency', () => {
    expect(getPlanPriceV2(tier({ currency: 'usd' }), option({ price: 189, amountMinor: 18_900 }))).toEqual({
      headline: '$94.50',
      suffix: '/Safe/mo',
      line: '$189/mo billed monthly · excl. VAT',
    })
  })

  it('falls back to the whole-unit price when the option carries no minor amount', () => {
    expect(getPlanPriceV2(tier(), option({ price: 189 })).headline).toBe('€94.50')
  })

  it('shows the monthly total when the Safe count is unknown or unlimited', () => {
    expect(getPlanPriceV2(tier(), option({ seats: null, price: 499, amountMinor: 49_900 }))).toEqual({
      headline: '€499',
      suffix: '/mo',
      line: '€499/mo billed monthly · excl. VAT',
    })
  })

  it('shows custom pricing when the option has no price', () => {
    expect(getPlanPriceV2(tier({ name: 'Enterprise', billingCycle: null }), option({ seats: null }))).toEqual({
      headline: 'Custom',
      suffix: 'Annual term',
      line: 'Pricing by agreement · Billed annually',
    })
  })
})
