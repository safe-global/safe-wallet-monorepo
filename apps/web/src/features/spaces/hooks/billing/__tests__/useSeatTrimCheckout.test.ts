import { act, renderHook } from '@testing-library/react'
import { useSeatTrimCheckout } from '../useSeatTrimCheckout'

const mockStartCheckout = jest.fn()
const mockRemoveSafes = jest.fn()
let mockRemoveState: Record<string, unknown> = {}
let mockCheckoutState: Record<string, unknown> = {}

let mockSafes: { safes: Record<string, string[]> } = { safes: {} }
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesGetV1Query: () => ({ currentData: mockSafes }),
  useSpaceSafesDeleteV1Mutation: () => [mockRemoveSafes, { isLoading: false, error: undefined, ...mockRemoveState }],
}))
jest.mock('../useStartCheckout', () => ({
  useStartCheckout: (spaceId: string, returnPathname?: string) => ({
    startCheckout: (paymentLinkId: string) => mockStartCheckout(spaceId, returnPathname, paymentLinkId),
    isRedirecting: false,
    isError: false,
    ...mockCheckoutState,
  }),
}))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

describe('useSeatTrimCheckout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRemoveState = {}
    mockCheckoutState = {}
    mockRemoveSafes.mockResolvedValue({ data: undefined })
    mockSafes = { safes: { '1': ['0xA', '0xB'], '10': ['0xC'] } }
  })

  it('counts the Workspace Safes across chains and asks to trim only when the plan covers fewer', () => {
    const { result } = renderHook(() => useSeatTrimCheckout(SPACE_ID))

    expect(result.current.seatCount).toBe(3)
    expect(result.current.needsTrim(2)).toBe(true)
    expect(result.current.needsTrim(3)).toBe(false)
    expect(result.current.needsTrim(20)).toBe(false)
    expect(result.current.needsTrim(null)).toBe(false)
    expect(result.current.needsTrim(undefined)).toBe(false)
  })

  it('skips the trim for a Workspace without Safes', () => {
    mockSafes = { safes: {} }
    expect(renderHook(() => useSeatTrimCheckout(SPACE_ID)).result.current.needsTrim(2)).toBe(false)
  })

  it('removes the Safes left out before sending the browser to Stripe', async () => {
    const { result } = renderHook(() => useSeatTrimCheckout(SPACE_ID, '/welcome/select-safes'))

    let ok = false
    await act(async () => {
      ok = await result.current.checkout('pl_starter', [{ chainId: '10', address: '0xC' }])
    })

    expect(ok).toBe(true)
    expect(mockRemoveSafes).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      deleteSpaceSafesDto: { safes: [{ chainId: '10', address: '0xC' }] },
    })
    expect(mockStartCheckout).toHaveBeenCalledWith(SPACE_ID, '/welcome/select-safes', 'pl_starter')
  })

  it('goes straight to Stripe when nothing is removed, and stops when the removal fails', async () => {
    const { result } = renderHook(() => useSeatTrimCheckout(SPACE_ID))

    await act(async () => {
      await result.current.checkout('pl_business')
    })
    expect(mockRemoveSafes).not.toHaveBeenCalled()
    expect(mockStartCheckout).toHaveBeenCalledWith(SPACE_ID, undefined, 'pl_business')

    mockRemoveSafes.mockResolvedValue({ error: { status: 500 } })
    let ok = true
    await act(async () => {
      ok = await result.current.checkout('pl_business', [{ chainId: '1', address: '0xA' }])
    })
    expect(ok).toBe(false)
    expect(mockStartCheckout).toHaveBeenCalledTimes(1)
  })

  it('words the removal and checkout errors', () => {
    mockRemoveState = { error: { status: 500, data: { message: 'Boom' } } }
    expect(renderHook(() => useSeatTrimCheckout(SPACE_ID)).result.current.error).toBe('Boom')

    mockRemoveState = {}
    mockCheckoutState = { isError: true }
    expect(renderHook(() => useSeatTrimCheckout(SPACE_ID)).result.current.error).toBe(
      'We couldn’t start the checkout. Please try again.',
    )
  })
})
