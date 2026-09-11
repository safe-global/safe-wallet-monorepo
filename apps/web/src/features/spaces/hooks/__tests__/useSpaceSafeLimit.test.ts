import { renderHook } from '@testing-library/react'
import { useSpaceSafeLimit } from '../useSpaceSafeLimit'

const mockUseHasFeature = jest.fn()
const mockUseSpaceEntitlements = jest.fn()
jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => mockUseHasFeature() }))
jest.mock('../billing/useSpaceEntitlements', () => ({
  useSpaceEntitlements: (spaceId?: string) => mockUseSpaceEntitlements(spaceId),
}))
jest.mock('../../constants', () => ({ SAFE_ACCOUNTS_LIMIT: 40 }))

describe('useSpaceSafeLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
    mockUseSpaceEntitlements.mockReturnValue({ seats: { used: 6, quota: 10 }, isLoading: false })
  })

  it('uses the plan seat quota under Safe Pro, scoped to the given space', () => {
    expect(renderHook(() => useSpaceSafeLimit('space-1')).result.current).toEqual({ limit: 10, isLoading: false })
    expect(mockUseSpaceEntitlements).toHaveBeenCalledWith('space-1')
  })

  it('reports an unlimited plan as a null limit', () => {
    mockUseSpaceEntitlements.mockReturnValue({ seats: { used: 6, quota: null }, isLoading: false })
    expect(renderHook(() => useSpaceSafeLimit()).result.current.limit).toBeNull()
  })

  it('falls back to the static cap while Safe Pro is off', () => {
    mockUseHasFeature.mockReturnValue(false)
    expect(renderHook(() => useSpaceSafeLimit()).result.current).toEqual({ limit: 40, isLoading: false })
  })

  it('falls back to the static cap, flagged as loading, until the entitlements arrive', () => {
    mockUseSpaceEntitlements.mockReturnValue({ seats: null, isLoading: true })
    expect(renderHook(() => useSpaceSafeLimit()).result.current).toEqual({ limit: 40, isLoading: true })
  })
})
