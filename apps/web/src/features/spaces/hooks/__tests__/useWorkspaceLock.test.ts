import { renderHook } from '@testing-library/react'
import { useWorkspaceLock } from '../useWorkspaceLock'

const mockUseHasFeature = jest.fn()
const mockUseIsInvited = jest.fn()
const mockUseSpaceSubscription = jest.fn()
const mockUseSpaceOffers = jest.fn()
jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => mockUseHasFeature() }))
jest.mock('../useSpaceMembers', () => ({ useIsInvited: () => mockUseIsInvited() }))
jest.mock('../billing/useSpaceSubscription', () => ({
  useSpaceSubscription: (spaceId?: string) => mockUseSpaceSubscription(spaceId),
}))
jest.mock('../billing/useSpaceOffers', () => ({ useSpaceOffers: (spaceId?: string) => mockUseSpaceOffers(spaceId) }))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const canceled = { status: 'canceled', createdAt: 1, cancelledAt: 1_765_000_000, currentPeriodEnd: null }

describe('useWorkspaceLock', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
    mockUseIsInvited.mockReturnValue(false)
    mockUseSpaceSubscription.mockReturnValue({ status: 'none', latestSubscription: undefined, isLoading: false })
    mockUseSpaceOffers.mockReturnValue({ trialPeriodDays: 60, isLoading: false })
  })

  it.each(['none', 'canceled', 'pending'])('locks a lapsed Workspace whose plan status is %s', (status) => {
    mockUseSpaceSubscription.mockReturnValue({ status, latestSubscription: canceled, isLoading: false })
    mockUseSpaceOffers.mockReturnValue({ trialPeriodDays: null, isLoading: false })

    expect(renderHook(() => useWorkspaceLock()).result.current).toEqual({
      isLocked: true,
      isResolving: false,
      isError: false,
      retry: expect.any(Function),
      trialPeriodDays: null,
      reason: 'lapsed',
      endedAt: 1_765_000_000_000,
    })
  })

  it('locks a Workspace whose payment failed without reading its period end as an end date', () => {
    mockUseSpaceSubscription.mockReturnValue({
      status: 'payment_failed',
      latestSubscription: { ...canceled, status: 'past_due', cancelledAt: null, currentPeriodEnd: 1_770_000_000 },
      isLoading: false,
    })
    mockUseSpaceOffers.mockReturnValue({ trialPeriodDays: null, isLoading: false })

    expect(renderHook(() => useWorkspaceLock()).result.current).toMatchObject({
      isLocked: true,
      reason: 'payment-failed',
      endedAt: null,
    })
  })

  it('locks a never-subscribed Workspace behind its trial offer, scoped to the given space', () => {
    const { result } = renderHook(() => useWorkspaceLock(SPACE_ID))

    expect(result.current).toEqual({
      isLocked: true,
      isResolving: false,
      isError: false,
      retry: expect.any(Function),
      trialPeriodDays: 60,
      reason: 'trial-offered',
      endedAt: null,
    })
    expect(mockUseSpaceSubscription).toHaveBeenCalledWith(SPACE_ID)
    expect(mockUseSpaceOffers).toHaveBeenCalledWith(SPACE_ID)
  })

  it.each([
    ['SAFE_PRO is off', () => mockUseHasFeature.mockReturnValue(false)],
    ['the user is only invited', () => mockUseIsInvited.mockReturnValue(true)],
    [
      'the Workspace is on a trial',
      () => mockUseSpaceSubscription.mockReturnValue({ status: 'trialing', isLoading: false }),
    ],
    [
      'the Workspace is on a paid plan',
      () => mockUseSpaceSubscription.mockReturnValue({ status: 'active', isLoading: false }),
    ],
  ])('does not lock when %s', (_, arrange) => {
    arrange()

    expect(renderHook(() => useWorkspaceLock()).result.current.isLocked).toBe(false)
  })

  it('reports resolving, and not locked, while either source is loading', () => {
    mockUseSpaceOffers.mockReturnValue({ trialPeriodDays: null, isLoading: true })

    expect(renderHook(() => useWorkspaceLock()).result.current).toMatchObject({ isLocked: false, isResolving: true })
  })

  it('reports resolving while a query has not started yet, so an empty first render never reads as lapsed', () => {
    mockUseSpaceOffers.mockReturnValue({ trialPeriodDays: null, isLoading: false, isUninitialized: true })
    expect(renderHook(() => useWorkspaceLock()).result.current).toMatchObject({ isLocked: false, isResolving: true })

    mockUseSpaceOffers.mockReturnValue({ trialPeriodDays: null, isLoading: false, isUninitialized: false })
    mockUseSpaceSubscription.mockReturnValue({ status: 'none', isLoading: false, isUninitialized: true })
    expect(renderHook(() => useWorkspaceLock()).result.current).toMatchObject({ isLocked: false, isResolving: true })
  })

  it('keeps the last-known plan when a background refetch fails, instead of blocking the Workspace', () => {
    mockUseSpaceSubscription.mockReturnValue({ status: 'active', isLoading: false, isError: true, hasData: true })

    expect(renderHook(() => useWorkspaceLock()).result.current).toMatchObject({ isLocked: false, isError: false })
  })

  it('keeps locking on the last-known lapsed plan when a background refetch fails', () => {
    mockUseSpaceSubscription.mockReturnValue({
      status: 'canceled',
      latestSubscription: canceled,
      isLoading: false,
      isError: true,
      hasData: true,
    })
    mockUseSpaceOffers.mockReturnValue({ trialPeriodDays: null, isLoading: false, isError: true, hasData: true })

    expect(renderHook(() => useWorkspaceLock()).result.current).toMatchObject({
      isLocked: true,
      isError: false,
      reason: 'lapsed',
    })
  })

  it('ignores a failed offers source while the plan is live', () => {
    mockUseSpaceSubscription.mockReturnValue({ status: 'trialing', isLoading: false, hasData: true })
    mockUseSpaceOffers.mockReturnValue({ trialPeriodDays: null, isLoading: false, isError: true })

    expect(renderHook(() => useWorkspaceLock()).result.current).toMatchObject({ isLocked: false, isError: false })
  })

  it('asks for a retry when a Workspace that is not live cannot read its offers', () => {
    mockUseSpaceOffers.mockReturnValue({ trialPeriodDays: null, isLoading: false, isError: true })

    expect(renderHook(() => useWorkspaceLock()).result.current).toMatchObject({ isLocked: false, isError: true })
  })

  it('asks for a retry instead of locking when a source failed, and retries both sources', () => {
    const refetchPlan = jest.fn()
    const refetchOffers = jest.fn()
    mockUseSpaceSubscription.mockReturnValue({ status: 'none', isLoading: false, isError: true, refetch: refetchPlan })
    mockUseSpaceOffers.mockReturnValue({ trialPeriodDays: null, isLoading: false, refetch: refetchOffers })

    const { result } = renderHook(() => useWorkspaceLock())
    expect(result.current).toMatchObject({ isLocked: false, isError: true })

    result.current.retry()
    expect(refetchPlan).toHaveBeenCalledTimes(1)
    expect(refetchOffers).toHaveBeenCalledTimes(1)
  })

  it('does not report an error while a source is still resolving or the lock does not apply', () => {
    mockUseSpaceOffers.mockReturnValue({ trialPeriodDays: null, isLoading: true, isError: true })
    expect(renderHook(() => useWorkspaceLock()).result.current.isError).toBe(false)

    mockUseHasFeature.mockReturnValue(false)
    mockUseSpaceOffers.mockReturnValue({ trialPeriodDays: null, isLoading: false, isError: true })
    expect(renderHook(() => useWorkspaceLock()).result.current.isError).toBe(false)
  })

  it('never reports resolving while the lock does not apply', () => {
    mockUseHasFeature.mockReturnValue(false)
    mockUseSpaceSubscription.mockReturnValue({ status: 'none', isLoading: true })

    expect(renderHook(() => useWorkspaceLock()).result.current.isResolving).toBe(false)
  })
})
