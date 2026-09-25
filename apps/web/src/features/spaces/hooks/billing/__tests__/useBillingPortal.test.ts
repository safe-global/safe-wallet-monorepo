import { act, renderHook } from '@testing-library/react'
import { useBillingPortal } from '../useBillingPortal'

const mockTrigger = jest.fn()
const mockBillingSpaceId = jest.fn<string | null, []>()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/billing', () => ({
  useLazyBillingGetSessionUrlV1Query: () => [mockTrigger, { isFetching: false, isError: false }],
}))
jest.mock('../useBillingSpaceId', () => ({ useBillingSpaceId: () => mockBillingSpaceId() }))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

describe('useBillingPortal', () => {
  const assign = jest.fn()
  const originalLocation = window.location

  beforeEach(() => {
    jest.clearAllMocks()
    mockBillingSpaceId.mockReturnValue(SPACE_ID)
    Object.defineProperty(window, 'location', { value: { ...originalLocation, assign }, writable: true })
  })

  afterAll(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
  })

  it('requests the portal URL returning to the Plans page and redirects to it', async () => {
    mockTrigger.mockResolvedValue({ data: { url: 'https://billing.stripe.com/p_1' } })
    const { result } = renderHook(() => useBillingPortal())

    await act(() => result.current.openPortal())

    expect(mockTrigger).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      returnUrl: expect.stringContaining(`/spaces/plans?spaceId=${SPACE_ID}`),
    })
    expect(assign).toHaveBeenCalledWith('https://billing.stripe.com/p_1')
  })

  it('does nothing while the billing queries are gated', async () => {
    mockBillingSpaceId.mockReturnValue(null)
    const { result } = renderHook(() => useBillingPortal())

    await act(() => result.current.openPortal())

    expect(mockTrigger).not.toHaveBeenCalled()
  })

  it('stays put when the request fails', async () => {
    mockTrigger.mockResolvedValue({ error: { status: 403 } })
    const { result } = renderHook(() => useBillingPortal())

    await act(() => result.current.openPortal())

    expect(assign).not.toHaveBeenCalled()
  })
})
