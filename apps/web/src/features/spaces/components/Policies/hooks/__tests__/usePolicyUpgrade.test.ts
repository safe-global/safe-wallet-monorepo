import { act, renderHook } from '@testing-library/react'
import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import type { PlanTier } from '../../../Plans/types'
import { pickUpgrade, usePolicyUpgrade } from '../usePolicyUpgrade'

const mockUseSpacePlan = jest.fn()
const mockUseSpaceOffers = jest.fn()
const mockUseChangePlan = jest.fn()

jest.mock('@/services/analytics', () => ({ trackEvent: jest.fn() }))
jest.mock('../../../../hooks/useSpacePlan', () => ({ useSpacePlan: (spaceId: string) => mockUseSpacePlan(spaceId) }))
jest.mock('../../../../hooks/billing/useSpaceOffers', () => ({
  useSpaceOffers: (spaceId: string) => mockUseSpaceOffers(spaceId),
}))
jest.mock('../../../../hooks/billing/useChangePlan', () => ({
  useChangePlan: (spaceId: string) => mockUseChangePlan(spaceId),
}))

const SPACE_ID = 'space-1'

const option = (seats: number | null, paymentLinkId: string | null = `pl_${seats}`) => ({
  paymentLinkId,
  priceId: `price_${seats}`,
  label: `${seats} Safe accounts`,
  seats,
  price: 499,
  originalPrice: null,
})

const tier = (name: string, billingCycle: 'month' | 'year' | null, seats: number[], isCurrent = false): PlanTier => ({
  id: `${name}-${billingCycle}`,
  name,
  currency: 'eur',
  billingCycle,
  options: seats.map((count) => option(count)),
  features: [],
  isCurrent,
})

const offer = (seats: number, cycle: 'month' | 'year' = 'month') => ({
  paymentLinkId: `pl_business_${seats}_${cycle}`,
  priceId: `price_business_${seats}_${cycle}`,
  planName: 'Business',
  seats,
  price: cycle === 'month' ? 499 : 5389,
  currency: 'eur',
  billingCycle: cycle,
  trialPeriodDays: null,
})

const starterSubscription = {
  id: 'sub_1',
  status: 'active',
  createdAt: 1,
  metadata: {},
  plan: {
    id: 'price_starter',
    name: 'Starter',
    currentPrice: 149,
    originalPrice: null,
    currency: 'eur',
    billingCycle: 'month',
    features: [],
  },
} as unknown as Subscription

describe('pickUpgrade', () => {
  it('should, when Business is offered monthly and yearly, pick the monthly option that fits every Safe account', () => {
    const pick = pickUpgrade([tier('Business', 'year', [20, 50]), tier('Business', 'month', [50, 20])], 6)

    expect(pick?.tier.billingCycle).toBe('month')
    expect(pick?.option.seats).toBe(20)
  })

  it('should, when the workspace holds more Safes than any option covers, pick the largest option', () => {
    const pick = pickUpgrade([tier('Business', 'month', [20, 50])], 80)

    expect(pick?.option.seats).toBe(50)
  })

  it('should, when Business is only offered yearly, pick the yearly tier', () => {
    const pick = pickUpgrade([tier('Business', 'year', [20])], 6)

    expect(pick?.tier.billingCycle).toBe('year')
  })

  it('should, when Business is the current plan, pick nothing', () => {
    expect(pickUpgrade([tier('Business', 'month', [20], true)], 6)).toBeUndefined()
  })

  it('should, when no Business tier is offered or its options have no payment link, pick nothing', () => {
    expect(pickUpgrade([tier('Starter', 'month', [2]), tier('Enterprise', null, [])], 6)).toBeUndefined()
    expect(pickUpgrade([{ ...tier('Business', 'month', []), options: [option(20, null)] }], 6)).toBeUndefined()
  })
})

describe('usePolicyUpgrade', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSpacePlan.mockReturnValue({
      plan: { name: 'Starter', status: 'active', periodEndsAt: null, daysLeft: null },
      subscription: starterSubscription,
      isTrialing: false,
      seats: { used: 6, quota: 10 },
    })
    mockUseSpaceOffers.mockReturnValue({
      paidPlans: [{ name: 'Business', offers: [offer(20), offer(50), offer(20, 'year')] }],
    })
    mockUseChangePlan.mockReturnValue({ canChange: true })
  })

  it('should, when the plan can be changed, build the current plan and the Business pick', () => {
    const { result } = renderHook(() => usePolicyUpgrade(SPACE_ID))

    expect(result.current.currentPlan).toMatchObject({ name: 'Starter', price: 149, isTrialing: false })
    expect(result.current.pick).toMatchObject({
      tier: { name: 'Business', billingCycle: 'month' },
      option: { seats: 20, paymentLinkId: 'pl_business_20_month' },
    })
    expect(mockUseSpacePlan).toHaveBeenCalledWith(SPACE_ID)
    expect(mockUseSpaceOffers).toHaveBeenCalledWith(SPACE_ID)
    expect(mockUseChangePlan).toHaveBeenCalledWith(SPACE_ID)
  })

  it('should, when the plan cannot be changed, offer neither a current plan nor a pick', () => {
    mockUseChangePlan.mockReturnValue({ canChange: false })

    const { result } = renderHook(() => usePolicyUpgrade(SPACE_ID))

    expect(result.current.currentPlan).toBeUndefined()
    expect(result.current.pick).toBeUndefined()
  })

  it('should, when opened, track the upgrade click and report the flow as open until closed', () => {
    const { result } = renderHook(() => usePolicyUpgrade(SPACE_ID))

    expect(result.current.isOpen).toBe(false)

    act(() => result.current.open())

    expect(result.current.isOpen).toBe(true)
    expect(trackEvent).toHaveBeenCalledWith(POLICY_EVENTS.POLICY_UPGRADE_CLICKED)

    act(() => result.current.close())

    expect(result.current.isOpen).toBe(false)
  })
})
