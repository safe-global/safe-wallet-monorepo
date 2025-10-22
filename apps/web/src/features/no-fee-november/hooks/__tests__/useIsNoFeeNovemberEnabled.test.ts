import { renderHook } from '@testing-library/react'
import useIsNoFeeNovemberEnabled from '@/features/no-fee-november/hooks/useIsNoFeeNovemberEnabled'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useHasFeature } from '@/hooks/useChains'

// Mock the dependencies
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChains')

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseHasFeature = useHasFeature as jest.MockedFunction<typeof useHasFeature>

describe('useIsNoFeeNovemberEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return true when feature is enabled and on Mainnet (mock mode)', () => {
    mockUseHasFeature.mockReturnValue(true)
    mockUseSafeInfo.mockReturnValue({
      safe: { chainId: '1' },
    } as any)

    const { result } = renderHook(() => useIsNoFeeNovemberEnabled())

    expect(result.current).toBe(true)
  })

  it('should return true in mock mode regardless of feature flag (temporary)', () => {
    mockUseHasFeature.mockReturnValue(false)
    mockUseSafeInfo.mockReturnValue({
      safe: { chainId: '1' },
    } as any)

    const { result } = renderHook(() => useIsNoFeeNovemberEnabled())

    // Currently returns true due to mock - this will change when mock is removed
    expect(result.current).toBe(true)
  })

  it('should return true in mock mode regardless of chain (temporary)', () => {
    mockUseHasFeature.mockReturnValue(true)
    mockUseSafeInfo.mockReturnValue({
      safe: { chainId: '137' }, // Polygon
    } as any)

    const { result } = renderHook(() => useIsNoFeeNovemberEnabled())

    // Currently returns true due to mock - this will change when mock is removed
    expect(result.current).toBe(true)
  })

  it('should return true in mock mode regardless of both conditions (temporary)', () => {
    mockUseHasFeature.mockReturnValue(false)
    mockUseSafeInfo.mockReturnValue({
      safe: { chainId: '137' }, // Polygon
    } as any)

    const { result } = renderHook(() => useIsNoFeeNovemberEnabled())

    // Currently returns true due to mock - this will change when mock is removed
    expect(result.current).toBe(true)
  })
})
