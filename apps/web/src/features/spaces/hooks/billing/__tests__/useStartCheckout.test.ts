import { renderHook, act } from '@testing-library/react'
import { navigateTo } from '@/utils/navigation'
import { useStartCheckout } from '../useStartCheckout'

const mockTrigger = jest.fn()
const mockBillingSpaceId = jest.fn<string | null, []>()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/billing', () => ({
  useLazyBillingGetCheckoutUrlV1Query: () => [mockTrigger, { isFetching: false, isError: false }],
}))
jest.mock('@/utils/navigation')
jest.mock('../useBillingSpaceId', () => ({ useBillingSpaceId: () => mockBillingSpaceId() }))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

describe('useStartCheckout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('requests the checkout URL with the Home return URL and redirects to it', async () => {
    mockBillingSpaceId.mockReturnValue(SPACE_ID)
    mockTrigger.mockResolvedValue({ data: { sessionId: 'cs_1', url: 'https://checkout.stripe.com/cs_1' } })
    const { result } = renderHook(() => useStartCheckout())

    await act(() => result.current.startCheckout('pl_business_10'))

    expect(mockTrigger).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      paymentLinkId: 'pl_business_10',
      returnUrl: expect.stringContaining(`/spaces?spaceId=${SPACE_ID}&sessionId={CHECKOUT_SESSION_ID}`),
    })
    expect(navigateTo).toHaveBeenCalledWith('https://checkout.stripe.com/cs_1')
  })

  it('returns to the onboarding when a flow asks for it', async () => {
    mockBillingSpaceId.mockReturnValue(SPACE_ID)
    mockTrigger.mockResolvedValue({ data: { sessionId: 'cs_1', url: 'https://checkout.stripe.com/cs_1' } })
    const { result } = renderHook(() => useStartCheckout(undefined, '/welcome/create-space'))

    await act(() => result.current.startCheckout('pl_business_10'))

    expect(mockTrigger).toHaveBeenCalledWith(
      expect.objectContaining({
        returnUrl: expect.stringContaining(`/welcome/create-space?spaceId=${SPACE_ID}&sessionId=`),
      }),
    )
  })

  it('does nothing while the billing queries are gated, and stays put when the request fails', async () => {
    mockBillingSpaceId.mockReturnValue(null)
    const gated = renderHook(() => useStartCheckout())
    await act(() => gated.result.current.startCheckout('pl_business_10'))
    expect(mockTrigger).not.toHaveBeenCalled()

    mockBillingSpaceId.mockReturnValue(SPACE_ID)
    mockTrigger.mockResolvedValue({ error: { status: 403 } })
    const failing = renderHook(() => useStartCheckout())
    await act(() => failing.result.current.startCheckout('pl_business_10'))
    expect(navigateTo).not.toHaveBeenCalled()
  })
})
