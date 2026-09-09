import type { PaymentLink } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import {
  getPlanName,
  getPrice,
  getSeats,
  getTrialPeriodDays,
  groupOffersByPlan,
  splitPlansByTrial,
  toPlanOffer,
} from '../paymentLinks'

const link = (overrides: Partial<PaymentLink> & { id: string }): PaymentLink => ({
  url: 'https://buy.stripe.com/x',
  active: true,
  metadata: {},
  ...overrides,
})

const priced = (unitAmount: number, interval: 'month' | 'year', quantity = 1) => [
  { price: { unitAmount, currency: 'eur', recurring: { interval, intervalCount: 1 } }, quantity },
]

const business10 = link({
  id: 'pl_business_10',
  metadata: { planName: 'Business', FEATURE_SAFE_SEATS: '10' },
  lineItems: priced(49_900, 'month'),
  trialPeriodDays: 60,
})
const business50 = link({
  id: 'pl_business_50',
  metadata: { planName: 'Business', FEATURE_SAFE_SEATS: '50' },
  lineItems: priced(99_900, 'month'),
})
const business10Yearly = link({
  id: 'pl_business_10_year',
  metadata: { planName: 'Business', FEATURE_SAFE_SEATS: '10' },
  lineItems: priced(538_900, 'year'),
})
const starter = link({
  id: 'pl_starter',
  metadata: { planName: 'Starter', FEATURE_SAFE_SEATS: '2' },
  lineItems: priced(14_900, 'month'),
})

describe('paymentLinks', () => {
  it('reads the plan name and falls back to null when untagged', () => {
    expect(getPlanName(business10)).toBe('Business')
    expect(getPlanName(link({ id: 'x' }))).toBeNull()
  })

  it.each([
    ['10', 10],
    [' 20 ', 20],
    ['unlimited', 'unlimited'],
    ['Unlimited', 'unlimited'],
    ['-1', null],
    ['ten', null],
    ['', null],
    [undefined, null],
  ])('parses FEATURE_SAFE_SEATS=%p as %p', (raw, expected) => {
    const metadata = raw === undefined ? {} : { FEATURE_SAFE_SEATS: raw }
    expect(getSeats(link({ id: 'x', metadata }))).toBe(expected)
  })

  it('sums line items in whole currency units and reads the cycle', () => {
    expect(getPrice(business10)).toEqual({ price: 499, currency: 'eur', billingCycle: 'month' })
    expect(getPrice(business10Yearly)).toEqual({ price: 5389, currency: 'eur', billingCycle: 'year' })
    expect(getPrice(link({ id: 'x', lineItems: priced(1_000, 'month', 3) }))).toMatchObject({ price: 30 })
  })

  it('returns a null price without priced line items', () => {
    expect(getPrice(link({ id: 'x' }))).toEqual({ price: null, currency: 'eur', billingCycle: null })
    expect(getPrice(link({ id: 'x', lineItems: [{ price: { unitAmount: null } }] }))).toMatchObject({ price: null })
  })

  it('drops inactive and untagged links', () => {
    expect(toPlanOffer(link({ ...business10, active: false }))).toBeNull()
    expect(toPlanOffer(link({ id: 'x', lineItems: priced(100, 'month') }))).toBeNull()
  })

  it('maps a link to an offer', () => {
    expect(toPlanOffer(business10)).toEqual({
      paymentLinkId: 'pl_business_10',
      planName: 'Business',
      seats: 10,
      price: 499,
      currency: 'eur',
      billingCycle: 'month',
      trialPeriodDays: 60,
    })
    expect(toPlanOffer(starter)?.trialPeriodDays).toBeNull()
  })

  it('groups offers by plan name in catalog order, monthly before yearly, seats ascending', () => {
    const plans = groupOffersByPlan([
      business50,
      starter,
      business10Yearly,
      business10,
      link({ id: 'off', active: false }),
    ])

    expect(plans.map((plan) => plan.name)).toEqual(['Business', 'Starter'])
    expect(plans[0].offers.map((offer) => offer.paymentLinkId)).toEqual([
      'pl_business_10',
      'pl_business_50',
      'pl_business_10_year',
    ])
    expect(plans[1].offers).toHaveLength(1)
  })

  it('surfaces the offered trial length, or null when only paid links are offered', () => {
    expect(getTrialPeriodDays(groupOffersByPlan([starter, business10]))).toBe(60)
    expect(getTrialPeriodDays(groupOffersByPlan([starter, business50]))).toBeNull()
    expect(getTrialPeriodDays([])).toBeNull()
  })

  it('splits the offered plans into trial and paid sides, dropping empty groups', () => {
    const { trialPlans, paidPlans } = splitPlansByTrial(groupOffersByPlan([business10, business50, starter]))

    expect(trialPlans).toEqual([
      { name: 'Business', offers: [expect.objectContaining({ paymentLinkId: 'pl_business_10' })] },
    ])
    expect(paidPlans.map((plan) => [plan.name, plan.offers.map((offer) => offer.paymentLinkId)])).toEqual([
      ['Business', ['pl_business_50']],
      ['Starter', ['pl_starter']],
    ])
    expect(splitPlansByTrial([])).toEqual({ trialPlans: [], paidPlans: [] })
  })
})
