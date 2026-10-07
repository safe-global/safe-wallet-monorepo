import { renderHook } from '@testing-library/react'
import {
  SUBSCRIPTION_CHECK_FAILED_MESSAGE,
  getDeletionBlockedReason,
  useSpaceDeletionGuard,
} from '../useSpaceDeletionGuard'
import type { useSpaceSubscription } from '../useSpaceSubscription'

type SubscriptionState = ReturnType<typeof useSpaceSubscription>

const mockUseSpaceSubscription = jest.fn<Partial<SubscriptionState>, [string | null | undefined]>()

jest.mock('../useSpaceSubscription', () => ({
  useSpaceSubscription: (spaceId: string | null | undefined) => mockUseSpaceSubscription(spaceId),
}))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

const state = (overrides: Partial<SubscriptionState>): Partial<SubscriptionState> => ({
  subscription: undefined,
  status: 'none',
  isLoading: false,
  isError: false,
  hasData: true,
  ...overrides,
})

describe('useSpaceDeletionGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('checks the subscription of the given space', () => {
    mockUseSpaceSubscription.mockReturnValue(state({}))
    renderHook(() => useSpaceDeletionGuard(SPACE_ID))

    expect(mockUseSpaceSubscription).toHaveBeenCalledWith(SPACE_ID)
  })

  it.each(['none', 'canceled'] as const)('allows deletion when the subscription status is %s', (status) => {
    mockUseSpaceSubscription.mockReturnValue(state({ status }))
    const { result } = renderHook(() => useSpaceDeletionGuard(SPACE_ID))

    expect(result.current).toEqual({ isDeletionBlocked: false })
  })

  it.each(['trialing', 'active', 'payment_failed', 'pending'] as const)(
    'blocks deletion and explains why when the subscription status is %s',
    (status) => {
      mockUseSpaceSubscription.mockReturnValue(
        state({ status, subscription: { cancelAt: null } as SubscriptionState['subscription'] }),
      )
      const { result } = renderHook(() => useSpaceDeletionGuard(SPACE_ID))

      expect(result.current).toEqual({ isDeletionBlocked: true, blockedReason: getDeletionBlockedReason(null) })
    },
  )

  it('keeps deletion blocked while a requested cancellation is still pending in Stripe', () => {
    const cancelAt = Date.UTC(2026, 10, 15) / 1000
    mockUseSpaceSubscription.mockReturnValue(
      state({ status: 'active', subscription: { cancelAt } as SubscriptionState['subscription'] }),
    )
    const { result } = renderHook(() => useSpaceDeletionGuard(SPACE_ID))

    expect(result.current.isDeletionBlocked).toBe(true)
    expect(result.current.blockedReason).toBe(getDeletionBlockedReason(cancelAt))
    expect(result.current.blockedReason).toContain('Nov 15, 2026')
  })

  it('blocks deletion without a reason while the subscription is loading', () => {
    mockUseSpaceSubscription.mockReturnValue(state({ isLoading: true, hasData: false }))
    const { result } = renderHook(() => useSpaceDeletionGuard(SPACE_ID))

    expect(result.current).toEqual({ isDeletionBlocked: true })
  })

  it('blocks deletion when the subscription cannot be checked', () => {
    mockUseSpaceSubscription.mockReturnValue(state({ isError: true, hasData: false }))
    const { result } = renderHook(() => useSpaceDeletionGuard(SPACE_ID))

    expect(result.current).toEqual({ isDeletionBlocked: true, blockedReason: SUBSCRIPTION_CHECK_FAILED_MESSAGE })
  })

  it('relies on the last known subscription when only a refetch failed', () => {
    mockUseSpaceSubscription.mockReturnValue(state({ isError: true, hasData: true, status: 'canceled' }))
    const { result } = renderHook(() => useSpaceDeletionGuard(SPACE_ID))

    expect(result.current).toEqual({ isDeletionBlocked: false })
  })
})
