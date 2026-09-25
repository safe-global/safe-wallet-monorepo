import { renderHook } from '@testing-library/react'
import { useSafeSponsoredTxs } from '../useSafeSponsoredTxs'

const mockUseHasFeature = jest.fn()
const mockUseSafeInfo = jest.fn()
const mockUseSafeSpaces = jest.fn()
const mockUseSpacePlan = jest.fn()
jest.mock('@/hooks/useChains', () => ({ useHasFeature: (feature: string) => mockUseHasFeature(feature) }))
jest.mock('@/hooks/useSafeInfo', () => ({ __esModule: true, default: () => mockUseSafeInfo() }))
jest.mock('@/hooks/useSafeSpaces', () => ({
  ...jest.requireActual('@/hooks/useSafeSpaces'),
  useSafeSpaces: (skip: boolean) => mockUseSafeSpaces(skip),
}))
jest.mock('../useSpacePlan', () => ({ useSpacePlan: (spaceId: string | null) => mockUseSpacePlan(spaceId) }))
let mockCurrentSpaceId: string | null = null
jest.mock('../useCurrentSpaceId', () => ({ useCurrentSpaceId: () => mockCurrentSpaceId }))

const SAFE = { safe: { chainId: '1' }, safeAddress: '0xAbC' }
const SPACE = { uuid: 'space-1' }
const meter = { used: 20, quota: 50, resetsAt: '2026-11-01T00:00:00.000Z' }

describe('useSafeSponsoredTxs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentSpaceId = 'space-1'
    mockUseHasFeature.mockReturnValue(true)
    mockUseSafeInfo.mockReturnValue(SAFE)
    mockUseSafeSpaces.mockReturnValue({ safeSpaces: { '1:0xabc': [SPACE] }, isLoading: false })
    mockUseSpacePlan.mockReturnValue({ plan: { status: 'active' }, sponsoredTxs: meter, isLoading: false })
  })

  it('reads the allowance of the Workspace the Safe belongs to', () => {
    const { result } = renderHook(() => useSafeSponsoredTxs())

    expect(mockUseSafeSpaces).toHaveBeenCalledWith(false)
    expect(mockUseSpacePlan).toHaveBeenCalledWith('space-1')
    expect(result.current).toEqual({
      isEnabled: true,
      isPro: true,
      meter,
      left: 30,
      spaceId: 'space-1',
      canSponsor: true,
      isLoading: false,
    })
  })

  it('only charges the Workspace the user is working in, and none when that one does not hold the Safe', () => {
    mockUseSafeSpaces.mockReturnValue({ safeSpaces: { '1:0xabc': [SPACE, { uuid: 'space-2' }] }, isLoading: false })
    mockCurrentSpaceId = 'space-2'
    renderHook(() => useSafeSponsoredTxs())
    expect(mockUseSpacePlan).toHaveBeenLastCalledWith('space-2')

    mockCurrentSpaceId = 'space-elsewhere'
    expect(renderHook(() => useSafeSponsoredTxs()).result.current).toMatchObject({ isPro: false, spaceId: null })
    expect(mockUseSpacePlan).toHaveBeenLastCalledWith(null)
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
    mockUseSafeSpaces.mockReturnValue({ safeSpaces: {}, isLoading: false })
    expect(renderHook(() => useSafeSponsoredTxs()).result.current).toMatchObject({
      isEnabled: true,
      isPro: false,
      meter: null,
      left: null,
      spaceId: null,
      canSponsor: false,
    })
    expect(mockUseSpacePlan).toHaveBeenCalledWith(null)

    mockUseSafeSpaces.mockReturnValue({ safeSpaces: { '1:0xabc': [SPACE] }, isLoading: false })
    mockUseSpacePlan.mockReturnValue({ plan: null, sponsoredTxs: null, isLoading: false })
    expect(renderHook(() => useSafeSponsoredTxs()).result.current.isPro).toBe(false)
  })

  it('stays off and skips the lookup while SAFE_PRO is off', () => {
    mockUseHasFeature.mockReturnValue(false)
    const { result } = renderHook(() => useSafeSponsoredTxs())

    expect(mockUseSafeSpaces).toHaveBeenCalledWith(true)
    expect(mockUseSpacePlan).toHaveBeenCalledWith(null)
    expect(result.current).toEqual({
      isEnabled: false,
      isPro: false,
      meter: null,
      left: null,
      spaceId: null,
      canSponsor: false,
      isLoading: false,
    })
  })

  it('reports loading while the Workspaces or the plan resolve', () => {
    mockUseSafeSpaces.mockReturnValue({ safeSpaces: {}, isLoading: true })
    expect(renderHook(() => useSafeSponsoredTxs()).result.current.isLoading).toBe(true)

    mockUseSafeSpaces.mockReturnValue({ safeSpaces: { '1:0xabc': [SPACE] }, isLoading: false })
    mockUseSpacePlan.mockReturnValue({ plan: null, sponsoredTxs: null, isLoading: true })
    expect(renderHook(() => useSafeSponsoredTxs()).result.current.isLoading).toBe(true)
  })
})
