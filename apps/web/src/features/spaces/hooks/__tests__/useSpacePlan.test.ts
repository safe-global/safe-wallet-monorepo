import { renderHook } from '@testing-library/react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useSpacePlan } from '../useSpacePlan'

const mockEntitlementsQuery = jest.fn()
const mockSubscriptionsQuery = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/entitlements', () => ({
  useEntitlementsGetEntitlementsV1Query: (...args: unknown[]) => mockEntitlementsQuery(...args),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/billing', () => ({
  useBillingGetSubscriptionsV1Query: (...args: unknown[]) => mockSubscriptionsQuery(...args),
}))

const mockUseHasFeature = jest.fn()
const mockIsSignedIn = jest.fn()
jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => mockUseHasFeature() }))
jest.mock('@/store', () => ({ useAppSelector: () => mockIsSignedIn() }))
jest.mock('@/store/authSlice', () => ({ isAuthenticated: jest.fn() }))
jest.mock('../useCurrentSpaceId', () => ({ useCurrentSpaceId: () => SPACE_ID }))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const OTHER_SPACE_ID = '22222222-2222-2222-2222-222222222222'

const entitlements = (plan: { name: string | null; cycleEndsAt: string | null } | null, quota = 10, used = 6) => ({
  data: {
    plan: plan && { id: 'plan_1', ...plan },
    entitlements: [{ feature: 'safe_seats', type: 'metered', enabled: true, quota, used, resetsAt: null }],
  },
  isLoading: false,
})
const subscriptions = (status: string, name = 'Business') => ({
  data: [{ id: 'sub_1', status, plan: { id: 'plan_1', name } }],
  isLoading: false,
})

describe('useSpacePlan', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
    mockIsSignedIn.mockReturnValue(true)
    mockEntitlementsQuery.mockReturnValue({ data: undefined, isLoading: false })
    mockSubscriptionsQuery.mockReturnValue({ data: undefined, isLoading: false })
  })

  it('renders a trial from the subscription status and the entitlements cycle', () => {
    mockEntitlementsQuery.mockReturnValue(entitlements({ name: 'Business', cycleEndsAt: '2026-12-06T00:00:00Z' }))
    mockSubscriptionsQuery.mockReturnValue(subscriptions('trialing'))

    const { result } = renderHook(() => useSpacePlan())

    expect(result.current.plan).toEqual({ name: 'Business', status: 'trialing', periodEndsAt: '2026-12-06T00:00:00Z' })
    expect(result.current).toMatchObject({ tierName: 'Business', isTrialing: true, isPaidActive: false })
    expect(result.current.seats).toEqual({ used: 6, quota: 10 })
    expect(mockEntitlementsQuery).toHaveBeenCalledWith({ spaceId: SPACE_ID }, expect.anything())
  })

  it('renders a paid plan and falls back to the entitlements plan name', () => {
    mockEntitlementsQuery.mockReturnValue(entitlements({ name: 'Business', cycleEndsAt: null }))
    mockSubscriptionsQuery.mockReturnValue(subscriptions('active', null as unknown as string))

    const { result } = renderHook(() => useSpacePlan())

    expect(result.current.plan).toEqual({ name: 'Business', status: 'active', periodEndsAt: null })
    expect(result.current.isPaidActive).toBe(true)
  })

  it('reports no plan without a subscription or when it lapsed', () => {
    mockEntitlementsQuery.mockReturnValue(entitlements(null))
    expect(renderHook(() => useSpacePlan()).result.current).toMatchObject({
      plan: null,
      status: 'none',
      isTrialing: false,
      isPaidActive: false,
    })

    mockSubscriptionsQuery.mockReturnValue(subscriptions('past_due'))
    expect(renderHook(() => useSpacePlan()).result.current).toMatchObject({ plan: null, status: 'payment_failed' })
  })

  it('queries the given space instead of the current one', () => {
    renderHook(() => useSpacePlan(OTHER_SPACE_ID))

    expect(mockEntitlementsQuery).toHaveBeenCalledWith({ spaceId: OTHER_SPACE_ID }, expect.anything())
    expect(mockSubscriptionsQuery).toHaveBeenCalledWith({ spaceId: OTHER_SPACE_ID }, expect.anything())
  })

  it.each([
    ['SAFE_PRO is off', () => mockUseHasFeature.mockReturnValue(false)],
    ['the user is signed out', () => mockIsSignedIn.mockReturnValue(false)],
  ])('skips both queries while %s', (_, arrange) => {
    arrange()
    const { result } = renderHook(() => useSpacePlan())

    expect(mockEntitlementsQuery).toHaveBeenCalledWith(skipToken, expect.anything())
    expect(mockSubscriptionsQuery).toHaveBeenCalledWith(skipToken, expect.anything())
    expect(result.current.plan).toBeNull()
  })

  it('aggregates loading across both sources', () => {
    mockSubscriptionsQuery.mockReturnValue({ data: undefined, isLoading: true })
    expect(renderHook(() => useSpacePlan()).result.current.isLoading).toBe(true)
  })
})
