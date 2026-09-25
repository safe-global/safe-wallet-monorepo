import { renderHook } from '@testing-library/react'
import { usePlanCatalog } from '../usePlanCatalog'

const mockUseSpacePlan = jest.fn()
const mockUseSpaceOffers = jest.fn()
jest.mock('../../../hooks/useSpacePlan', () => ({ useSpacePlan: (spaceId?: string) => mockUseSpacePlan(spaceId) }))
jest.mock('../../../hooks/billing/useSpaceOffers', () => ({
  useSpaceOffers: (spaceId?: string) => mockUseSpaceOffers(spaceId),
}))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const STARTER = {
  name: 'Starter',
  offers: [
    {
      paymentLinkId: 'pl_starter',
      priceId: 'price_starter',
      planName: 'Starter',
      seats: 2,
      price: 149,
      currency: 'eur',
      billingCycle: 'month',
      trialPeriodDays: null,
    },
  ],
}
const subscription = (status: string) => ({
  id: 'sub_1',
  status,
  hasPaymentMethod: false,
  plan: {
    id: 'price_business',
    name: 'Business',
    currentPrice: 499,
    originalPrice: null,
    currency: 'eur',
    billingCycle: 'month',
    features: [],
  },
})
const PLAN = { name: 'Business', status: 'trialing', periodEndsAt: '2026-12-06T00:00:00Z', daysLeft: 5 }

const names = (tiers: Array<{ name: string; isCurrent?: boolean }>) =>
  tiers.map((tier) => [tier.name, tier.isCurrent ?? false])

describe('usePlanCatalog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSpaceOffers.mockReturnValue({ paidPlans: [STARTER], isLoading: true })
    mockUseSpacePlan.mockReturnValue({
      plan: PLAN,
      seats: { used: 6, quota: 20 },
      sponsoredTxs: { used: 0, quota: 10 },
      subscription: subscription('trialing'),
      isTrialing: true,
      isLoading: false,
    })
  })

  it('merges a live plan into the catalog as the current card, next to Enterprise', () => {
    const { result } = renderHook(() => usePlanCatalog(SPACE_ID))

    expect(mockUseSpacePlan).toHaveBeenCalledWith(SPACE_ID)
    expect(mockUseSpaceOffers).toHaveBeenCalledWith(SPACE_ID)
    expect(result.current.currentPlan).toMatchObject({
      name: 'Business',
      price: 499,
      isTrialing: true,
      daysLeft: 5,
      seatsLabel: '20 Safe accounts',
    })
    expect(names(result.current.tiers)).toEqual([
      ['Starter', false],
      ['Business', true],
      ['Enterprise', false],
    ])
    expect(result.current).toMatchObject({ plan: PLAN, isPlanLoading: false, isOffersLoading: true })
  })

  it('leaves out the Enterprise card on request', () => {
    const { result } = renderHook(() => usePlanCatalog(SPACE_ID, { withEnterprise: false }))

    expect(names(result.current.tiers)).toEqual([
      ['Starter', false],
      ['Business', true],
    ])
  })

  it('has no current plan or card for a subscription that is no longer live', () => {
    mockUseSpacePlan.mockReturnValue({
      plan: null,
      seats: null,
      sponsoredTxs: null,
      subscription: subscription('canceled'),
      isTrialing: false,
      isLoading: false,
    })
    const { result } = renderHook(() => usePlanCatalog(SPACE_ID, { withEnterprise: false }))

    expect(result.current.currentPlan).toBeUndefined()
    expect(names(result.current.tiers)).toEqual([['Starter', false]])
    expect(result.current.subscription).toMatchObject({ status: 'canceled' })
  })
})
