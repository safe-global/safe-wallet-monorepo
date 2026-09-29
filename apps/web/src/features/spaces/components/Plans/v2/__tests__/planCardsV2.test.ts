import {
  COMPARE_SECTIONS_V2,
  ENTERPRISE_TIER,
  getPlanContentV2,
  PLAN_CONTENT_V2,
  PLAN_FEATURES,
  PLAN_ORDER,
  WORKSPACE_2FA,
} from '../../planCatalog'
import type { CurrentPlan, PlanSeatOption, PlanTier } from '../../types'
import { canManageV2, getPlanCtaV2, getTiersV2 } from '../planCardsV2'

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

  it('never repeats a feature between plans', () => {
    const features = Object.values(PLAN_CONTENT_V2).flatMap((content) => content.additionalFeatures)
    expect(new Set(features).size).toBe(features.length)
  })

  it('keeps every launch card feature, counting what each plan inherits', () => {
    const SPONSORSHIP = /sponsored transactions/
    const renamed: Record<string, string> = {
      '10 sponsored transactions / month': '10 sponsored transactions per month',
      '50 sponsored transactions / month': '50 sponsored transactions per month',
      'Policy engine': 'Policy engine & spending limits',
      'MFA authentication': WORKSPACE_2FA,
    }

    PLAN_ORDER.forEach((plan, index) => {
      const inherited = PLAN_ORDER.slice(0, index + 1).flatMap((name) => PLAN_CONTENT_V2[name].additionalFeatures)
      const own = PLAN_CONTENT_V2[plan].additionalFeatures
      PLAN_FEATURES[plan].forEach((launchFeature) => {
        const feature = renamed[launchFeature] ?? launchFeature
        // A sponsorship quota replaces the inherited one, so each plan must state its own.
        expect(SPONSORSHIP.test(feature) ? own : inherited).toContain(feature)
      })
    })
  })

  it('agrees with the comparison table on what each plan includes', () => {
    const rows = COMPARE_SECTIONS_V2.flatMap((section) => section.rows)
    const listed = new Set(Object.values(PLAN_CONTENT_V2).flatMap((content) => content.additionalFeatures))

    PLAN_ORDER.forEach((plan, index) => {
      const inherited = PLAN_ORDER.slice(0, index + 1).flatMap((name) => PLAN_CONTENT_V2[name].additionalFeatures)
      const value = (feature: string) => rows.find((row) => row.feature === feature)?.values?.[plan]
      rows
        .filter((row) => listed.has(row.feature))
        .forEach((row) => expect(row.values?.[plan]).toBe(inherited.includes(row.feature)))

      const own = PLAN_CONTENT_V2[plan].additionalFeatures
      expect(own).toContainEqual(expect.stringContaining(`${value('Sponsored transactions per month')} sponsored`))
      expect(own).toContain(`${value('API access')} API access`)
    })
  })

  it('leaves the coming-soon fee payment out of every plan', () => {
    const features = Object.values(PLAN_CONTENT_V2).flatMap((content) => content.additionalFeatures)
    expect(features.filter((feature) => /pay (fees|gas)/i.test(feature))).toEqual([])
  })

  it('looks content up by plan name, ignoring names outside the catalog', () => {
    expect(getPlanContentV2('Business')).toBe(PLAN_CONTENT_V2.Business)
    expect(getPlanContentV2('Safe Pro')).toBeUndefined()
    expect(getPlanContentV2('toString')).toBeUndefined()
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
