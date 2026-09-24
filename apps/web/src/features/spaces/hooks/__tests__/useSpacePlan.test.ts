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
  currentData: {
    plan: plan && { id: 'plan_1', ...plan },
    entitlements: [{ feature: 'safe_seats', type: 'metered', enabled: true, quota, used, resetsAt: null }],
  },
  isLoading: false,
})
const subscriptions = (status: string, name = 'Business') => ({
  currentData: [{ id: 'sub_1', status, plan: { id: 'plan_1', name } }],
  isLoading: false,
})

describe('useSpacePlan', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
    mockIsSignedIn.mockReturnValue(true)
    mockEntitlementsQuery.mockReturnValue({ currentData: undefined, isLoading: false })
    mockSubscriptionsQuery.mockReturnValue({ currentData: undefined, isLoading: false })
    jest.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 10, 22, 12))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders a trial from the subscription status and the entitlements cycle', () => {
    mockEntitlementsQuery.mockReturnValue(entitlements({ name: 'Business', cycleEndsAt: '2026-12-06T00:00:00Z' }))
    mockSubscriptionsQuery.mockReturnValue(subscriptions('trialing'))

    const { result } = renderHook(() => useSpacePlan())

    expect(result.current.plan).toEqual({
      name: 'Business',
      status: 'trialing',
      periodEndsAt: '2026-12-06T00:00:00Z',
      daysLeft: 14,
      hasPaymentMethod: false,
    })
    expect(result.current).toMatchObject({
      tierName: 'Business',
      isTrialing: true,
      isTrialEndingSoon: false,
      isPaidActive: false,
    })
    expect(result.current.seats).toEqual({ used: 6, quota: 10 })
    expect(mockEntitlementsQuery).toHaveBeenCalledWith({ spaceId: SPACE_ID }, expect.anything())
  })

  it('renders a paid plan and falls back to the entitlements plan name', () => {
    mockEntitlementsQuery.mockReturnValue(entitlements({ name: 'Business', cycleEndsAt: null }))
    mockSubscriptionsQuery.mockReturnValue(subscriptions('active', null as unknown as string))

    const { result } = renderHook(() => useSpacePlan())

    expect(result.current.plan).toEqual({
      name: 'Business',
      status: 'active',
      periodEndsAt: null,
      daysLeft: null,
      hasPaymentMethod: false,
    })
    expect(result.current.isPaidActive).toBe(true)
  })

  it('falls back to the subscription for the name and the period end while the entitlements lag', () => {
    mockEntitlementsQuery.mockReturnValue(entitlements(null))
    mockSubscriptionsQuery.mockReturnValue({
      currentData: [
        {
          id: 'sub_1',
          status: 'trialing',
          plan: { id: 'plan_1' },
          metadata: { planName: 'Business' },
          currentPeriodEnd: Date.UTC(2026, 11, 6) / 1000,
        },
      ],
      isLoading: false,
    })

    const { result } = renderHook(() => useSpacePlan())

    expect(result.current.plan).toEqual({
      name: 'Business',
      status: 'trialing',
      periodEndsAt: '2026-12-06T00:00:00.000Z',
      daysLeft: 14,
      hasPaymentMethod: false,
    })
  })

  it('flags a trial in its last week', () => {
    mockEntitlementsQuery.mockReturnValue(entitlements({ name: 'Business', cycleEndsAt: '2026-11-29T00:00:00Z' }))
    mockSubscriptionsQuery.mockReturnValue(subscriptions('trialing'))

    const { result } = renderHook(() => useSpacePlan())

    expect(result.current.plan?.daysLeft).toBe(7)
    expect(result.current.isTrialEndingSoon).toBe(true)
  })

  it('reads the switch to another Workspace as loading instead of showing the previous plan', () => {
    mockEntitlementsQuery.mockReturnValue({ currentData: undefined, isLoading: false, isFetching: true })
    mockSubscriptionsQuery.mockReturnValue({ currentData: undefined, isLoading: false, isFetching: true })

    const { result } = renderHook(() => useSpacePlan())

    expect(result.current.plan).toBeNull()
    expect(result.current.status).toBe('none')
    expect(result.current.isLoading).toBe(true)
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
    mockSubscriptionsQuery.mockReturnValue({ currentData: undefined, isLoading: true })
    expect(renderHook(() => useSpacePlan()).result.current.isLoading).toBe(true)
  })

  it('reports uninitialized until both queries have started', () => {
    mockSubscriptionsQuery.mockReturnValue({ currentData: undefined, isLoading: false, isUninitialized: true })
    expect(renderHook(() => useSpacePlan()).result.current.isUninitialized).toBe(true)

    mockSubscriptionsQuery.mockReturnValue({ currentData: undefined, isLoading: false, isUninitialized: false })
    mockEntitlementsQuery.mockReturnValue({ currentData: undefined, isLoading: false, isUninitialized: false })
    expect(renderHook(() => useSpacePlan()).result.current.isUninitialized).toBe(false)
  })
})
