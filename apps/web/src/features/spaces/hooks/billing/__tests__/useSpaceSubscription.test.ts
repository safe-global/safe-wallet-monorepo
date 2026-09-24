import { renderHook } from '@testing-library/react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useSpaceSubscription } from '../useSpaceSubscription'

const mockQuery = jest.fn()
const mockBillingSpaceId = jest.fn<string | null, []>()
const mockIsRetrying = jest.fn<boolean, []>()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/billing', () => ({
  useBillingGetSubscriptionsV1Query: (...args: unknown[]) => mockQuery(...args),
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

describe('useSpaceSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBillingSpaceId.mockReturnValue(SPACE_ID)
    mockIsRetrying.mockReturnValue(false)
    mockQuery.mockReturnValue(queryState())
  })

  it('queries the gated space, and skips while billing is gated', () => {
    renderHook(() => useSpaceSubscription())
    expect(mockQuery).toHaveBeenLastCalledWith({ spaceId: SPACE_ID }, expect.anything())

    mockBillingSpaceId.mockReturnValue(null)
    renderHook(() => useSpaceSubscription())
    expect(mockQuery).toHaveBeenLastCalledWith(skipToken, expect.anything())
  })

  it('derives the current and latest subscription and the plan status', () => {
    const canceled = { id: 'old', status: 'canceled', createdAt: 2 }
    const trialing = { id: 'trial', status: 'trialing', createdAt: 1 }
    mockQuery.mockReturnValue(queryState({ currentData: [canceled, trialing] }))

    expect(renderHook(() => useSpaceSubscription()).result.current).toMatchObject({
      subscription: trialing,
      latestSubscription: canceled,
      status: 'trialing',
    })
  })

  it('reads as loading while another Workspace’s result is on its way', () => {
    mockQuery.mockReturnValue(queryState({ isFetching: true }))
    expect(renderHook(() => useSpaceSubscription()).result.current).toMatchObject({ isLoading: true, status: 'none' })
  })

  it('reads a 404 as no subscriptions, not as an error, also while it refetches', () => {
    mockQuery.mockReturnValue(queryState({ isError: true, error: { status: 404 } }))
    expect(renderHook(() => useSpaceSubscription()).result.current).toMatchObject({
      subscription: undefined,
      latestSubscription: undefined,
      status: 'none',
      isLoading: false,
      isError: false,
    })

    mockQuery.mockReturnValue(queryState({ isFetching: true, error: { status: 404 } }))
    expect(renderHook(() => useSpaceSubscription()).result.current).toMatchObject({ isLoading: false, isError: false })
  })

  it('keeps other errors as errors', () => {
    mockQuery.mockReturnValue(queryState({ isError: true, error: { status: 500 } }))
    expect(renderHook(() => useSpaceSubscription()).result.current).toMatchObject({ status: 'none', isError: true })
  })

  it('reads a rate-limited query as loading, not as an error, while it retries', () => {
    mockQuery.mockReturnValue(queryState({ isError: true, error: { status: 429 } }))
    mockIsRetrying.mockReturnValue(true)
    expect(renderHook(() => useSpaceSubscription()).result.current).toMatchObject({ isLoading: true, isError: false })

    mockIsRetrying.mockReturnValue(false)
    expect(renderHook(() => useSpaceSubscription()).result.current).toMatchObject({ isLoading: false, isError: true })
  })
})
