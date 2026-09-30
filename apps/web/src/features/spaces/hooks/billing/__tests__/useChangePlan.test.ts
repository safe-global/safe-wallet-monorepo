import { act, renderHook } from '@testing-library/react'
import { useChangePlan } from '../useChangePlan'

const mockTriggerPreview = jest.fn()
const mockUpdate = jest.fn()
const mockUseSpaceSubscription = jest.fn()
const mockBillingSpaceId = jest.fn<string | null, []>()
let mockPreviewState: Record<string, unknown> = { data: undefined, isFetching: false, error: undefined }
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/billing', () => ({
  useLazyBillingPreviewSubscriptionUpdateV1Query: () => [mockTriggerPreview, mockPreviewState],
  useBillingUpdateSubscriptionV1Mutation: () => [mockUpdate, { isLoading: false, error: undefined }],
}))
jest.mock('../useBillingSpaceId', () => ({ useBillingSpaceId: () => mockBillingSpaceId() }))
const mockDispatch = jest.fn()
jest.mock('@/store', () => ({ useAppDispatch: () => mockDispatch }))
const mockSyncPlanChange = jest.fn().mockResolvedValue(true)
jest.mock('../syncPlanChange', () => ({ syncPlanChange: (...args: unknown[]) => mockSyncPlanChange(...args) }))
jest.mock('../useSpaceSubscription', () => ({ useSpaceSubscription: () => mockUseSpaceSubscription() }))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

describe('useChangePlan', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBillingSpaceId.mockReturnValue(SPACE_ID)
    mockUseSpaceSubscription.mockReturnValue({ subscription: { id: 'sub_1' }, status: 'trialing' })
    mockPreviewState = { data: undefined, isFetching: false, error: undefined }
  })

  it('previews and applies a plan change on the live subscription', async () => {
    mockUpdate.mockResolvedValue({ data: { subscriptionId: 'sub_1', success: true } })
    const { result } = renderHook(() => useChangePlan())

    expect(result.current.canChange).toBe(true)
    act(() => result.current.previewChange('price_starter'))
    expect(mockTriggerPreview).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      subscriptionId: 'sub_1',
      planId: 'price_starter',
    })

    let ok = false
    await act(async () => {
      ok = await result.current.changePlan('price_starter', 'pl_starter')
    })
    expect(mockUpdate).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      subscriptionId: 'sub_1',
      updateSubscriptionDto: { planId: 'price_starter', paymentLinkId: 'pl_starter' },
    })
    expect(ok).toBe(true)
    expect(mockSyncPlanChange).toHaveBeenCalledWith(mockDispatch, SPACE_ID, 'price_starter')
  })

  it('reports a failed change', async () => {
    mockUpdate.mockResolvedValue({ error: { status: 409 } })
    const { result } = renderHook(() => useChangePlan())

    let ok = true
    await act(async () => {
      ok = await result.current.changePlan('price_starter', 'pl_starter')
    })
    expect(ok).toBe(false)
    expect(mockSyncPlanChange).not.toHaveBeenCalled()
  })

  it.each([
    [
      'there is no live subscription',
      () => mockUseSpaceSubscription.mockReturnValue({ subscription: undefined, status: 'none' }),
    ],
    [
      'the subscription lapsed',
      () => mockUseSpaceSubscription.mockReturnValue({ subscription: { id: 'sub_1' }, status: 'canceled' }),
    ],
    ['billing is gated', () => mockBillingSpaceId.mockReturnValue(null)],
  ])('cannot change and does nothing when %s', async (_, arrange) => {
    arrange()
    const { result } = renderHook(() => useChangePlan())

    expect(result.current.canChange).toBe(false)
    act(() => result.current.previewChange('price_starter'))
    let ok = true
    await act(async () => {
      ok = await result.current.changePlan('price_starter', 'pl_starter')
    })
    expect(mockTriggerPreview).not.toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(ok).toBe(false)
  })
})
