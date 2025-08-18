import { renderHook } from '@testing-library/react'
import { useSafeIdentification } from '../useSafeIdentification'
import { analytics } from '@/services/analytics'
import useSafeAddress from '../useSafeAddress'
import { useIsSpaceRoute } from '../useIsSpaceRoute'

// Mock the dependencies
jest.mock('@/services/analytics', () => ({
  analytics: {
    identify: jest.fn(),
    reset: jest.fn(),
  },
}))

jest.mock('../useSafeAddress', () => jest.fn())
jest.mock('../useIsSpaceRoute', () => ({
  useIsSpaceRoute: jest.fn(),
}))

const mockUseSafeAddress = useSafeAddress as jest.MockedFunction<typeof useSafeAddress>
const mockUseIsSpaceRoute = useIsSpaceRoute as jest.MockedFunction<typeof useIsSpaceRoute>
const mockAnalytics = analytics as jest.Mocked<typeof analytics>

describe('useSafeIdentification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsSpaceRoute.mockReturnValue(false)
  })

  it('should identify user when safeAddress is provided and not in space route', () => {
    const safeAddress = '0x123456789abcdef'
    mockUseSafeAddress.mockReturnValue(safeAddress)

    renderHook(() => useSafeIdentification())

    expect(mockAnalytics.identify).toHaveBeenCalledWith(safeAddress)
    expect(mockAnalytics.reset).not.toHaveBeenCalled()
  })

  it('should not identify user when in space route', () => {
    const safeAddress = '0x123456789abcdef'
    mockUseSafeAddress.mockReturnValue(safeAddress)
    mockUseIsSpaceRoute.mockReturnValue(true)

    renderHook(() => useSafeIdentification())

    expect(mockAnalytics.identify).not.toHaveBeenCalled()
    expect(mockAnalytics.reset).not.toHaveBeenCalled()
  })

  it('should not identify user when no safeAddress', () => {
    mockUseSafeAddress.mockReturnValue('')

    renderHook(() => useSafeIdentification())

    expect(mockAnalytics.identify).not.toHaveBeenCalled()
    expect(mockAnalytics.reset).toHaveBeenCalled() // Reset is called when no address
  })

  it('should reset analytics when safeAddress becomes empty', () => {
    mockUseSafeAddress.mockReturnValue('')

    renderHook(() => useSafeIdentification())

    expect(mockAnalytics.reset).toHaveBeenCalled()
    expect(mockAnalytics.identify).not.toHaveBeenCalled()
  })

  it('should handle address changes correctly', () => {
    const { rerender } = renderHook(() => useSafeIdentification())

    // Initially no address
    mockUseSafeAddress.mockReturnValue('')
    rerender()
    expect(mockAnalytics.reset).toHaveBeenCalled()

    // Address becomes available
    jest.clearAllMocks()
    mockUseSafeAddress.mockReturnValue('0x123456789abcdef')
    rerender()
    expect(mockAnalytics.identify).toHaveBeenCalledWith('0x123456789abcdef')

    // Address changes
    jest.clearAllMocks()
    mockUseSafeAddress.mockReturnValue('0x987654321fedcba')
    rerender()
    expect(mockAnalytics.identify).toHaveBeenCalledWith('0x987654321fedcba')
  })
})