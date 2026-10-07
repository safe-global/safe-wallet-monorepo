import { renderHook } from '@testing-library/react'
import { useSafeSponsoredTxs } from '../useSafeSponsoredTxs'

const mockUseIsSafeProEnabled = jest.fn()
const mockUseSafeInfo = jest.fn()
const mockIsSignedIn = jest.fn()
const mockUseSpaceSafesGetV1Query = jest.fn()
const mockUseSpacePlan = jest.fn()
jest.mock('@/hooks/useIsSafeProEnabled', () => ({ useIsSafeProEnabled: () => mockUseIsSafeProEnabled() }))
jest.mock('@/hooks/useSafeInfo', () => ({ __esModule: true, default: () => mockUseSafeInfo() }))
jest.mock('@/store', () => ({ useAppSelector: () => mockIsSignedIn() }))
jest.mock('@/store/authSlice', () => ({ isAuthenticated: jest.fn() }))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesGetV1Query: (...args: unknown[]) => mockUseSpaceSafesGetV1Query(...args),
}))
jest.mock('../useSpacePlan', () => ({ useSpacePlan: (spaceId: string | null) => mockUseSpacePlan(spaceId) }))
let mockCurrentSpaceId: string | null = null
jest.mock('../useCurrentSpaceId', () => ({ useCurrentSpaceId: () => mockCurrentSpaceId }))

const SAFE = { safe: { chainId: '1' }, safeAddress: '0xAbC' }
const holding = (safes: Record<string, string[]>) => ({ currentData: { safes }, isFetching: false, isError: false })
const meter = { used: 20, quota: 50, resetsAt: '2026-11-01T00:00:00.000Z' }

describe('useSafeSponsoredTxs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentSpaceId = 'space-1'
    mockUseIsSafeProEnabled.mockReturnValue(true)
    mockUseSafeInfo.mockReturnValue(SAFE)
    mockIsSignedIn.mockReturnValue(true)
    mockUseSpaceSafesGetV1Query.mockReturnValue(holding({ '1': ['0xabc'] }))
    mockUseSpacePlan.mockReturnValue({
      plan: { status: 'active' },
      sponsoredTxs: meter,
      isLoading: false,
      isError: false,
    })
  })

  it('reads the allowance of the Workspace the Safe belongs to', () => {
    const { result } = renderHook(() => useSafeSponsoredTxs())

    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith({ spaceId: 'space-1' }, { skip: false })
    expect(mockUseSpacePlan).toHaveBeenCalledWith('space-1')
    expect(result.current).toEqual({
      isEnabled: true,
      isPro: true,
      meter,
      left: 30,
      spaceId: 'space-1',
      canSponsor: true,
      isLoading: false,
      isError: false,
    })
  })

  it('only looks up the Workspace the user is working in, and charges none when that one does not hold the Safe', () => {
    mockCurrentSpaceId = 'space-2'
    renderHook(() => useSafeSponsoredTxs())
    expect(mockUseSpaceSafesGetV1Query).toHaveBeenLastCalledWith({ spaceId: 'space-2' }, { skip: false })
    expect(mockUseSpacePlan).toHaveBeenLastCalledWith('space-2')

    mockUseSpaceSafesGetV1Query.mockReturnValue(holding({ '1': ['0xdef'] }))
    expect(renderHook(() => useSafeSponsoredTxs()).result.current).toMatchObject({ isPro: false, spaceId: null })
    expect(mockUseSpacePlan).toHaveBeenLastCalledWith(null)
  })

  it('keys membership by chain: the same address on another chain does not count', () => {
    mockUseSpaceSafesGetV1Query.mockReturnValue(holding({ '10': ['0xabc'] }))
    expect(renderHook(() => useSafeSponsoredTxs()).result.current).toMatchObject({ isPro: false, spaceId: null })
  })

  it('skips the lookup without a Safe, a Workspace or a session', () => {
    mockUseSafeInfo.mockReturnValue({ safe: { chainId: '' }, safeAddress: '' })
    renderHook(() => useSafeSponsoredTxs())
    expect(mockUseSpaceSafesGetV1Query).toHaveBeenLastCalledWith({ spaceId: 'space-1' }, { skip: true })

    mockUseSafeInfo.mockReturnValue(SAFE)
    mockCurrentSpaceId = null
    renderHook(() => useSafeSponsoredTxs())
    expect(mockUseSpaceSafesGetV1Query).toHaveBeenLastCalledWith({ spaceId: '' }, { skip: true })

    mockCurrentSpaceId = 'space-1'
    mockIsSignedIn.mockReturnValue(false)
    expect(renderHook(() => useSafeSponsoredTxs()).result.current).toMatchObject({ isPro: false, spaceId: null })
    expect(mockUseSpaceSafesGetV1Query).toHaveBeenLastCalledWith({ spaceId: 'space-1' }, { skip: true })
  })

  it('caps the count at zero and reads a missing quota as unlimited', () => {
    mockUseSpacePlan.mockReturnValue({
      plan: { status: 'active' },
      sponsoredTxs: { ...meter, used: 60 },
      isLoading: false,
    })
    expect(renderHook(() => useSafeSponsoredTxs()).result.current).toMatchObject({ left: 0, canSponsor: false })

    mockUseSpacePlan.mockReturnValue({
      plan: { status: 'active' },
      sponsoredTxs: { ...meter, quota: null },
      isLoading: false,
    })
    expect(renderHook(() => useSafeSponsoredTxs()).result.current).toMatchObject({
      isPro: true,
      left: null,
      canSponsor: true,
    })
  })

  it('is not Pro for a Safe outside any Workspace, or in one without a live plan', () => {
    mockUseSpaceSafesGetV1Query.mockReturnValue(holding({}))
    expect(renderHook(() => useSafeSponsoredTxs()).result.current).toMatchObject({
      isEnabled: true,
      isPro: false,
      meter: null,
      left: null,
      spaceId: null,
      canSponsor: false,
    })
    expect(mockUseSpacePlan).toHaveBeenCalledWith(null)

    mockIsSignedIn.mockReturnValue(true)
    mockUseSpaceSafesGetV1Query.mockReturnValue(holding({ '1': ['0xabc'] }))
    mockUseSpacePlan.mockReturnValue({ plan: null, sponsoredTxs: null, isLoading: false })
    expect(renderHook(() => useSafeSponsoredTxs()).result.current.isPro).toBe(false)
  })

  it('stays off and skips the lookup while SAFE_PRO is off', () => {
    mockUseIsSafeProEnabled.mockReturnValue(false)
    const { result } = renderHook(() => useSafeSponsoredTxs())

    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith({ spaceId: 'space-1' }, { skip: true })
    expect(mockUseSpacePlan).toHaveBeenCalledWith(null)
    expect(result.current).toEqual({
      isEnabled: false,
      isPro: false,
      meter: null,
      left: null,
      spaceId: null,
      canSponsor: false,
      isLoading: false,
      isError: false,
    })
  })

  it('keeps loading after a Workspace switch instead of reporting "not sponsored"', () => {
    // RTK Query's `isLoading` stays false on later fetches; only `isFetching` tells the new Workspace is in flight.
    mockUseSpaceSafesGetV1Query.mockReturnValue({ currentData: undefined, isLoading: false, isFetching: true })
    const { result } = renderHook(() => useSafeSponsoredTxs())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.canSponsor).toBe(false)
  })

  it("reports loading while the Workspace's Safes or the plan resolve", () => {
    mockUseSpaceSafesGetV1Query.mockReturnValue({ currentData: undefined, isFetching: true })
    expect(renderHook(() => useSafeSponsoredTxs()).result.current.isLoading).toBe(true)

    mockIsSignedIn.mockReturnValue(true)
    mockUseSpaceSafesGetV1Query.mockReturnValue(holding({ '1': ['0xabc'] }))
    mockUseSpacePlan.mockReturnValue({ plan: null, sponsoredTxs: null, isLoading: true })
    expect(renderHook(() => useSafeSponsoredTxs()).result.current.isLoading).toBe(true)
  })

  it("reports the lookup as failed when the Workspace's Safes cannot be loaded", () => {
    mockUseSpaceSafesGetV1Query.mockReturnValue({ currentData: undefined, isFetching: false, isError: true })

    expect(renderHook(() => useSafeSponsoredTxs()).result.current).toMatchObject({
      isError: true,
      isPro: false,
      isLoading: false,
    })
  })

  it('reports the lookup as failed when the plan cannot be loaded', () => {
    mockUseSpacePlan.mockReturnValue({ plan: null, sponsoredTxs: null, isLoading: false, isError: true })

    expect(renderHook(() => useSafeSponsoredTxs()).result.current).toMatchObject({ isError: true, isPro: false })
    expect(mockUseSpacePlan).toHaveBeenCalledWith('space-1')
  })
})
