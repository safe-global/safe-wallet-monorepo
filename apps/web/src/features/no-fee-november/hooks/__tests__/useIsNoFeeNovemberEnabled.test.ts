import { renderHook } from '@testing-library/react'
import useIsNoFeeNovemberEnabled from '@/features/no-fee-november/hooks/useIsNoFeeNovemberEnabled'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useHasFeature } from '@/hooks/useChains'
import { useContext } from 'react'

// Mock the dependencies
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChains')
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}))

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseHasFeature = useHasFeature as jest.MockedFunction<typeof useHasFeature>
const mockUseContext = useContext as jest.MockedFunction<typeof useContext>

describe('useIsNoFeeNovemberEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock geofencing to not be blocked by default
    mockUseContext.mockReturnValue(false)
  })

  it('should return true when feature is enabled, on Mainnet, and not geofenced', () => {
    mockUseHasFeature.mockReturnValue(true)
    mockUseSafeInfo.mockReturnValue({
      safe: { chainId: '1' },
    } as any)
    mockUseContext.mockReturnValue(false) // Not blocked country

    const { result } = renderHook(() => useIsNoFeeNovemberEnabled())

    expect(result.current).toBe(true)
  })

  it('should return false when in blocked country (geofenced)', () => {
    mockUseHasFeature.mockReturnValue(true)
    mockUseSafeInfo.mockReturnValue({
      safe: { chainId: '1' },
    } as any)
    mockUseContext.mockReturnValue(true) // Blocked country

    const { result } = renderHook(() => useIsNoFeeNovemberEnabled())

    expect(result.current).toBe(false)
  })

  it('should return false when feature is not enabled', () => {
    mockUseHasFeature.mockReturnValue(false)
    mockUseSafeInfo.mockReturnValue({
      safe: { chainId: '1' },
    } as any)
    mockUseContext.mockReturnValue(false)

    const { result } = renderHook(() => useIsNoFeeNovemberEnabled())

    expect(result.current).toBe(false)
  })

  it('should return false when not on Mainnet', () => {
    mockUseHasFeature.mockReturnValue(true)
    mockUseSafeInfo.mockReturnValue({
      safe: { chainId: '137' }, // Polygon
    } as any)
    mockUseContext.mockReturnValue(false)

    const { result } = renderHook(() => useIsNoFeeNovemberEnabled())

    expect(result.current).toBe(false)
  })

  it('should return false when geofenced AND not on Mainnet', () => {
    mockUseHasFeature.mockReturnValue(true)
    mockUseSafeInfo.mockReturnValue({
      safe: { chainId: '137' }, // Polygon
    } as any)
    mockUseContext.mockReturnValue(true) // Blocked country

    const { result } = renderHook(() => useIsNoFeeNovemberEnabled())

    expect(result.current).toBe(false)
  })

  it('should return false when geofenced even if feature is enabled and on Mainnet', () => {
    mockUseHasFeature.mockReturnValue(true)
    mockUseSafeInfo.mockReturnValue({
      safe: { chainId: '1' },
    } as any)
    mockUseContext.mockReturnValue(true) // Blocked country - this should override everything

    const { result } = renderHook(() => useIsNoFeeNovemberEnabled())

    expect(result.current).toBe(false)
  })
})
