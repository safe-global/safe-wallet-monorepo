import { renderHook } from '@testing-library/react'
import { useSpaceSafeLimit } from '../useSpaceSafeLimit'

const mockUseHasFeature = jest.fn()
const mockUseSpaceEntitlements = jest.fn()
const mockRefetch = jest.fn()
jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => mockUseHasFeature() }))
jest.mock('../billing/useSpaceEntitlements', () => ({
  useSpaceEntitlements: (spaceId?: string) => mockUseSpaceEntitlements(spaceId),
}))
jest.mock('../../constants', () => ({ SAFE_ACCOUNTS_LIMIT: 40 }))

const entitlements = (overrides: Record<string, unknown>) => ({
  seats: { used: 6, quota: 10 },
  isLoading: false,
  isError: false,
  refetch: mockRefetch,
  ...overrides,
})

describe('useSpaceSafeLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
    mockUseSpaceEntitlements.mockReturnValue(entitlements({}))
  })

  it('uses the plan seat quota under Safe Pro, scoped to the given space', () => {
    expect(renderHook(() => useSpaceSafeLimit('space-1')).result.current).toMatchObject({
      limit: 10,
      isLoading: false,
      isError: false,
    })
    expect(mockUseSpaceEntitlements).toHaveBeenCalledWith('space-1')
  })

  it('reports an unlimited plan as a null limit', () => {
    mockUseSpaceEntitlements.mockReturnValue(entitlements({ seats: { used: 6, quota: null } }))
    expect(renderHook(() => useSpaceSafeLimit()).result.current.limit).toBeNull()
  })

  it('falls back to the static cap only while Safe Pro is off', () => {
    mockUseHasFeature.mockReturnValue(false)
    mockUseSpaceEntitlements.mockReturnValue(entitlements({ seats: null, isError: true }))
    expect(renderHook(() => useSpaceSafeLimit()).result.current).toMatchObject({
      limit: 40,
      isLoading: false,
      isError: false,
    })
  })

  it('leaves the limit unknown, never the static cap, while the entitlements load', () => {
    mockUseSpaceEntitlements.mockReturnValue(entitlements({ seats: null, isLoading: true }))
    expect(renderHook(() => useSpaceSafeLimit()).result.current).toMatchObject({ limit: undefined, isLoading: true })
  })

  it('leaves the limit unknown and flags the error when the entitlements fail', () => {
    mockUseSpaceEntitlements.mockReturnValue(entitlements({ seats: null, isError: true }))
    const { result } = renderHook(() => useSpaceSafeLimit())

    expect(result.current).toMatchObject({ limit: undefined, isLoading: false, isError: true })
    result.current.retry()
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('leaves the limit unknown when the plan reports no seats meter', () => {
    mockUseSpaceEntitlements.mockReturnValue(entitlements({ seats: null }))
    expect(renderHook(() => useSpaceSafeLimit()).result.current.limit).toBeUndefined()
  })
})
