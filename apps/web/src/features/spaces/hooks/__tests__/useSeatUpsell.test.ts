import { renderHook } from '@testing-library/react'
import { useSeatUpsell } from '../useSeatUpsell'

const mockUseHasFeature = jest.fn()
const mockUseSpacePlan = jest.fn()
const mockUseSpaceOffers = jest.fn()
jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => mockUseHasFeature() }))
jest.mock('../useCurrentSpaceId', () => ({ useCurrentSpaceId: () => 'space-current' }))
jest.mock('../useSpacePlan', () => ({ useSpacePlan: (spaceId?: string) => mockUseSpacePlan(spaceId) }))
jest.mock('../billing/useSpaceOffers', () => ({ useSpaceOffers: (spaceId?: string) => mockUseSpaceOffers(spaceId) }))

const offer = (planName: string, seats: number | 'unlimited') => ({
  paymentLinkId: `pl_${planName}_${seats}`,
  priceId: null,
  planName,
  seats,
  price: 1,
  currency: 'eur',
  billingCycle: 'month',
  trialPeriodDays: null,
})

describe('useSeatUpsell', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
    mockUseSpacePlan.mockReturnValue({ seats: { used: 2, quota: 2 }, tierName: 'Starter' })
    mockUseSpaceOffers.mockReturnValue({
      paidPlans: [{ name: 'Business', offers: [offer('Business', 50), offer('Business', 20)] }],
    })
  })

  it('points a Starter Workspace to the smallest bigger plan on the Plans page', () => {
    const { result } = renderHook(() => useSeatUpsell())

    expect(result.current).toEqual({
      isSafePro: true,
      tierName: 'Starter',
      limit: 2,
      upgradePlanName: 'Business',
      plansHref: '/spaces/plans?spaceId=space-current',
    })
    expect(mockUseSpacePlan).toHaveBeenCalledWith('space-current')
  })

  it('offers no upgrade when nothing on offer covers more seats, scoped to the given space', () => {
    mockUseSpacePlan.mockReturnValue({ seats: { used: 20, quota: 20 }, tierName: 'Business' })
    mockUseSpaceOffers.mockReturnValue({ paidPlans: [{ name: 'Starter', offers: [offer('Starter', 2)] }] })

    const { result } = renderHook(() => useSeatUpsell('space-other'))

    expect(result.current).toMatchObject({
      limit: 20,
      upgradePlanName: undefined,
      plansHref: '/spaces/plans?spaceId=space-other',
    })
    expect(mockUseSpaceOffers).toHaveBeenCalledWith('space-other')
  })

  it('reports no limit while SAFE_PRO is off or the plan is unlimited', () => {
    mockUseHasFeature.mockReturnValue(false)
    expect(renderHook(() => useSeatUpsell()).result.current).toMatchObject({ isSafePro: false, limit: null })

    mockUseHasFeature.mockReturnValue(true)
    mockUseSpacePlan.mockReturnValue({ seats: { used: 3, quota: null }, tierName: 'Enterprise' })
    expect(renderHook(() => useSeatUpsell()).result.current).toMatchObject({ limit: null, upgradePlanName: undefined })
  })
})
