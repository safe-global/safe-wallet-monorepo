import { renderHook } from '@testing-library/react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useSpaceOffers } from '../useSpaceOffers'

const mockQuery = jest.fn()
const mockBillingSpaceId = jest.fn<string | null, []>()
const mockIsRetrying = jest.fn<boolean, []>()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/billing', () => ({
  useBillingGetSpacePaymentLinksV1Query: (...args: unknown[]) => mockQuery(...args),
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
const link = (id: string, trialPeriodDays: number | null) => ({
  id,
  url: 'https://buy.stripe.com/x',
  active: true,
  metadata: { planName: 'Business' },
  trialPeriodDays,
})

describe('useSpaceOffers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBillingSpaceId.mockReturnValue(SPACE_ID)
    mockIsRetrying.mockReturnValue(false)
    mockQuery.mockReturnValue(queryState())
  })

  it('queries the gated space, and skips while billing is gated', () => {
    renderHook(() => useSpaceOffers())
    expect(mockQuery).toHaveBeenLastCalledWith({ spaceId: SPACE_ID })

    mockBillingSpaceId.mockReturnValue(null)
    renderHook(() => useSpaceOffers())
    expect(mockQuery).toHaveBeenLastCalledWith(skipToken)
  })

  it('splits the offered links into trial and paid plans and surfaces the trial length', () => {
    mockQuery.mockReturnValue(queryState({ currentData: [link('pl_trial', 30), link('pl_paid', null)] }))
    const { result } = renderHook(() => useSpaceOffers())

    expect(result.current.trialPlans[0].offers.map((offer) => offer.paymentLinkId)).toEqual(['pl_trial'])
    expect(result.current.paidPlans[0].offers.map((offer) => offer.paymentLinkId)).toEqual(['pl_paid'])
    expect(result.current.trialPeriodDays).toBe(30)
  })

  it('reads as loading while another Workspace’s result is on its way', () => {
    mockQuery.mockReturnValue(queryState({ isFetching: true }))
    expect(renderHook(() => useSpaceOffers()).result.current).toMatchObject({ isLoading: true, plans: [] })
  })

  it('reads a rate-limited query as loading, not as an error, while it retries', () => {
    mockQuery.mockReturnValue(queryState({ isError: true, error: { status: 429 } }))
    mockIsRetrying.mockReturnValue(true)
    expect(renderHook(() => useSpaceOffers()).result.current).toMatchObject({ isLoading: true, isError: false })

    mockIsRetrying.mockReturnValue(false)
    expect(renderHook(() => useSpaceOffers()).result.current).toMatchObject({ isLoading: false, isError: true })
  })
})
