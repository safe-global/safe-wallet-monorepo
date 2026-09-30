import {
  COMING_SOON_V2,
  COMPARE_SECTIONS_V2,
  ENTERPRISE_TIER,
  getCardComingSoonV2,
  getCardFeaturesV2,
  getPlanContentV2,
  MULTIPLE_WORKSPACES,
  NAMED_SUPPORT_CONTACT,
  PLAN_CONTENT_V2,
  PLAN_FEATURES,
  PLAN_ORDER,
  MEMBERS,
  WORKSPACE_2FA,
} from '../../planCatalog'
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

describe('PLAN_CONTENT_V2', () => {
  it('describes every catalog plan', () => {
    expect(Object.keys(PLAN_CONTENT_V2)).toEqual(PLAN_ORDER)
  })

  it('lists only what each card adds over the plan below it, plus its own sponsored allowance', () => {
    const lists = PLAN_ORDER.map((plan) => getCardFeaturesV2(plan) ?? [])

    lists.slice(1).forEach((list, index) => {
      const lower = lists[index]
      expect(list.length).toBeGreaterThan(0)
      lower
        .filter((label) => !/sponsored transactions/.test(label))
        .forEach((label) => expect(list).not.toContain(label))
      expect(list.filter((label) => /sponsored transactions/.test(label))).toHaveLength(1)
    })
  })

  it('keeps 2FA and members off the cards but in the compare table, and API access out of both', () => {
    const cardLabels = PLAN_ORDER.flatMap((plan) => getCardFeaturesV2(plan) ?? [])
    const rows = COMPARE_SECTIONS_V2.flatMap((section) => section.rows)
    const tableRows = rows.map((row) => row.feature)

    expect(cardLabels).not.toContain(WORKSPACE_2FA)
    expect(cardLabels).not.toContain(MEMBERS)
    expect(tableRows).toEqual(expect.arrayContaining([WORKSPACE_2FA, MEMBERS]))
    expect(rows.find((row) => row.feature === MEMBERS)?.values).toEqual({
      Starter: 'Unlimited',
      Business: 'Unlimited',
      Enterprise: 'Unlimited',
    })
    expect([...cardLabels, ...tableRows].filter((label) => /API/.test(label))).toEqual([])
  })

  it('keeps every other launch card feature on the plan or one below it', () => {
    const renamed: Record<string, string> = {
      '10 sponsored transactions / month': '10 sponsored transactions per month',
      '50 sponsored transactions / month': '50 sponsored transactions per month',
      'Policy engine': 'Spending limits',
    }
    const dropped = /MFA|API access|Unlimited Workspace members/

    PLAN_ORDER.forEach((plan, rank) => {
      const labels = PLAN_ORDER.slice(0, rank + 1).flatMap((lower) => getCardFeaturesV2(lower) ?? [])
      PLAN_FEATURES[plan]
        .filter((feature) => !dropped.test(feature))
        .forEach((feature) => expect(labels).toContain(renamed[feature] ?? feature))
    })
  })

  it('adds the Enterprise-only terms to the Enterprise card and marks them Enterprise-only in the table', () => {
    const enterpriseOnly = [NAMED_SUPPORT_CONTACT]
    const rows = COMPARE_SECTIONS_V2.flatMap((section) => section.rows)

    expect(getCardFeaturesV2('Enterprise')).toEqual(expect.arrayContaining([MULTIPLE_WORKSPACES, ...enterpriseOnly]))
    expect(COMPARE_SECTIONS_V2[0].rows[0]).toEqual({
      feature: 'Workspaces',
      values: { Starter: '1', Business: '1', Enterprise: 'Multiple' },
    })
    expect(rows.find((row) => row.feature === MULTIPLE_WORKSPACES)).toBeUndefined()
    enterpriseOnly.forEach((feature) => {
      expect(getCardFeaturesV2('Business')).not.toContain(feature)
      expect(rows.find((row) => row.feature === feature)?.values).toEqual({
        Starter: false,
        Business: false,
        Enterprise: true,
      })
    })
  })

  it('agrees with the comparison table: a feature is included from the card that lists it upwards', () => {
    const rows = COMPARE_SECTIONS_V2.flatMap((section) => section.rows)
    const firstListedOn = (feature: string) =>
      PLAN_ORDER.findIndex((plan) => getCardFeaturesV2(plan)?.includes(feature))

    rows
      .filter((row) => firstListedOn(row.feature) !== -1)
      .forEach((row) =>
        PLAN_ORDER.forEach((plan, rank) => expect(row.values[plan]).toBe(rank >= firstListedOn(row.feature))),
      )

    const sponsored = rows.find((row) => row.feature === 'Sponsored transactions per month')
    PLAN_ORDER.forEach((plan) =>
      expect(getCardFeaturesV2(plan)).toContainEqual(expect.stringContaining(`${sponsored?.values[plan]} sponsored`)),
    )
  })

  it('orders the compare table limits, operations, security, support, then add-ons', () => {
    expect(COMPARE_SECTIONS_V2.map((section) => section.title)).toEqual([
      'Limits',
      'Operations',
      'Security & Safe Shield',
      'Support & service levels',
      'Add-ons',
    ])
  })

  it('keeps what is coming out of the included lists, marks it Soon in the table, and shows it on the first card that will get it', () => {
    const included = PLAN_ORDER.flatMap((plan) => getCardFeaturesV2(plan) ?? [])
    const tableRows = COMPARE_SECTIONS_V2.flatMap((section) => section.rows)

    COMING_SOON_V2.forEach((row) => {
      expect(included).not.toContain(row.feature)
      tableRows
        .filter((tableRow) => tableRow.feature === row.feature)
        .forEach((tableRow) => expect(tableRow.isComingSoon).toBe(true))
    })
    expect(getCardComingSoonV2('Starter')).toEqual(['Pay gas from your Safe'])
    expect(getCardComingSoonV2('Business')).toEqual(['Safenet checks', 'More policies'])
    expect(getCardComingSoonV2('Enterprise')).toEqual([])
    expect(getCardComingSoonV2('Safe Pro')).toBeUndefined()
  })

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
