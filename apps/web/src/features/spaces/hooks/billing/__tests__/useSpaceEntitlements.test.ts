import { renderHook } from '@testing-library/react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useSpaceEntitlements } from '../useSpaceEntitlements'

const mockQuery = jest.fn()
const mockBillingSpaceId = jest.fn<string | null, []>()
const mockIsRetrying = jest.fn<boolean, []>()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/entitlements', () => ({
  useEntitlementsGetEntitlementsV1Query: (...args: unknown[]) => mockQuery(...args),
}))
jest.mock('../useBillingSpaceId', () => ({ useBillingSpaceId: () => mockBillingSpaceId() }))
jest.mock('../useRateLimitRetry', () => ({ useRateLimitRetry: () => mockIsRetrying() }))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const queryState = (state: Record<string, unknown> = {}) => ({
  currentData: undefined,
  isLoading: false,
  isFetching: false,
  isUninitialized: false,
  isError: false,
  error: undefined,
  refetch: jest.fn(),
  ...state,
})

describe('useSpaceEntitlements', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBillingSpaceId.mockReturnValue(SPACE_ID)
    mockIsRetrying.mockReturnValue(false)
    mockQuery.mockReturnValue(queryState())
  })

  it('queries the gated space, and skips while billing is gated', () => {
    renderHook(() => useSpaceEntitlements())
    expect(mockQuery).toHaveBeenLastCalledWith({ spaceId: SPACE_ID }, expect.anything())

    mockBillingSpaceId.mockReturnValue(null)
    renderHook(() => useSpaceEntitlements())
    expect(mockQuery).toHaveBeenLastCalledWith(skipToken, expect.anything())
  })

  it('exposes the plan and its meters', () => {
    const plan = { id: 'plan', name: 'Business', cycleEndsAt: null }
    mockQuery.mockReturnValue(
      queryState({
        currentData: {
          plan,
          entitlements: [{ feature: 'safe_seats', type: 'metered', enabled: true, quota: 10, used: 6, resetsAt: null }],
        },
      }),
    )

    expect(renderHook(() => useSpaceEntitlements()).result.current).toMatchObject({
      plan,
      seats: { used: 6, quota: 10 },
      sponsoredTxs: null,
    })
  })

  it('reads as loading while another Workspace’s result is on its way', () => {
    mockQuery.mockReturnValue(queryState({ isFetching: true }))
    expect(renderHook(() => useSpaceEntitlements()).result.current).toMatchObject({ isLoading: true, plan: null })
  })

  it('reads a rate-limited query as loading, not as an error, while it retries', () => {
    mockQuery.mockReturnValue(queryState({ isError: true, error: { status: 429 } }))
    mockIsRetrying.mockReturnValue(true)
    expect(renderHook(() => useSpaceEntitlements()).result.current).toMatchObject({ isLoading: true, isError: false })

    mockIsRetrying.mockReturnValue(false)
    expect(renderHook(() => useSpaceEntitlements()).result.current).toMatchObject({ isLoading: false, isError: true })
  })
})
