import { renderHook } from '@testing-library/react'
import { skipToken } from '@reduxjs/toolkit/query'
import type { PaymentLink } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { useSpaceOffers } from '../useSpaceOffers'

const mockPaymentLinksQuery = jest.fn()
const mockBillingSpaceId = jest.fn<string | null, []>()
const mockRefetch = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/billing', () => ({
  useBillingGetSpacePaymentLinksV1Query: (...args: unknown[]) => mockPaymentLinksQuery(...args),
}))
jest.mock('../useBillingSpaceId', () => ({ useBillingSpaceId: () => mockBillingSpaceId() }))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

const link = (id: string, planName: string, trialPeriodDays?: number): PaymentLink => ({
  id,
  url: `https://buy.stripe.com/${id}`,
  active: true,
  metadata: { planName, FEATURE_SAFE_SEATS: '10' },
  lineItems: [{ price: { id: `price_${id}`, unitAmount: 49_900, currency: 'eur', recurring: { interval: 'month' } } }],
  trialPeriodDays,
})

const queryState = (overrides: Record<string, unknown> = {}) => ({
  currentData: undefined,
  isLoading: false,
  isFetching: false,
  isUninitialized: false,
  isError: false,
  error: undefined,
  refetch: mockRefetch,
  ...overrides,
})

describe('useSpaceOffers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBillingSpaceId.mockReturnValue(SPACE_ID)
    mockPaymentLinksQuery.mockReturnValue(queryState())
  })

  it('groups the offered links and splits trial from paid plans', () => {
    mockPaymentLinksQuery.mockReturnValue(
      queryState({ currentData: [link('pl_trial', 'Business', 60), link('pl_paid', 'Starter')] }),
    )
    const { result } = renderHook(() => useSpaceOffers(SPACE_ID))

    expect(mockPaymentLinksQuery).toHaveBeenCalledWith({ spaceId: SPACE_ID })
    expect(result.current.plans.map((plan) => plan.name)).toEqual(['Business', 'Starter'])
    expect(result.current.trialPlans.map((plan) => plan.name)).toEqual(['Business'])
    expect(result.current.paidPlans.map((plan) => plan.name)).toEqual(['Starter'])
    expect(result.current).toMatchObject({ trialPeriodDays: 60, isLoading: false, isError: false })
  })

  it('skips the query and offers nothing while the billing queries are gated', () => {
    mockBillingSpaceId.mockReturnValue(null)
    mockPaymentLinksQuery.mockReturnValue(queryState({ isUninitialized: true }))
    const { result } = renderHook(() => useSpaceOffers(SPACE_ID))

    expect(mockPaymentLinksQuery).toHaveBeenCalledWith(skipToken)
    expect(result.current).toMatchObject({
      plans: [],
      trialPlans: [],
      paidPlans: [],
      trialPeriodDays: null,
      isUninitialized: true,
    })
  })

  it('reports loading while the first fetch has no data yet', () => {
    mockPaymentLinksQuery.mockReturnValue(queryState({ isFetching: true }))
    const { result } = renderHook(() => useSpaceOffers(SPACE_ID))

    expect(result.current.isLoading).toBe(true)
  })

  it('reports an error without retrying when the request fails for a reason other than a rate limit', () => {
    mockPaymentLinksQuery.mockReturnValue(queryState({ isError: true, error: { status: 500, data: {} } }))
    const { result } = renderHook(() => useSpaceOffers(SPACE_ID))

    expect(result.current).toMatchObject({ plans: [], isLoading: false, isError: true })
    expect(mockRefetch).not.toHaveBeenCalled()
  })
})
