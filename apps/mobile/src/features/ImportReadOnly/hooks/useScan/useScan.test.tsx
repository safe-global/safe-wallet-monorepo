import { act, renderHook } from '@/src/tests/test-utils'
import { useScan } from './index'
import { Code } from 'react-native-vision-camera'

// Store the focus callback for later testing
let mockFocusCallback: (() => void) | null = null

// Mock react-native-vision-camera
jest.mock('react-native-vision-camera', () => ({
  Camera: {
    getCameraDevice: jest.fn(),
    requestCameraPermission: jest.fn(),
  },
  useCameraPermission: jest.fn(() => ({ hasPermission: true })),
  useCameraDevice: jest.fn(),
  useCodeScanner: jest.fn(),
}))

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useFocusEffect: jest.fn((callback: () => (() => void) | void) => {
    mockFocusCallback = callback
    // Don't call the callback immediately - only store it for manual testing
  }),
}))

// Mock the scanned-address contract directly rather than its internal parse/validate helpers.
const mockResolveScannedAddress = jest.fn()
jest.mock('@/src/components/Camera', () => ({
  resolveScannedAddress: (raw: string) => mockResolveScannedAddress(raw),
  INVALID_ADDRESS_MESSAGE: 'Not a valid address',
}))

const mockPush = jest.fn()

describe('useScan', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset focus callback
    mockFocusCallback = null
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useScan())

    expect(result.current.isCameraActive).toBe(false) // Now false by default since focus effect isn't called
    expect(result.current.errorMessage).toBeNull()
    expect(typeof result.current.setIsCameraActive).toBe('function')
    expect(typeof result.current.onScan).toBe('function')
  })

  describe('Error handling', () => {
    const activateCamera = () => {
      if (mockFocusCallback) {
        act(() => {
          const callback = mockFocusCallback as () => void
          callback()
        })
      }
    }

    it('surfaces an invalid address on the lens and pauses the camera', () => {
      mockResolveScannedAddress.mockReturnValue(null)

      const { result } = renderHook(() => useScan())
      activateCamera()

      act(() => {
        result.current.onScan([{ value: 'invalid-code' } as Code])
      })

      expect(result.current.errorMessage).toBe('Not a valid address')
      expect(result.current.isCameraActive).toBe(false)
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('clears the error and re-activates the camera on Try again', () => {
      mockResolveScannedAddress.mockReturnValue(null)

      const { result } = renderHook(() => useScan())
      activateCamera()

      act(() => {
        result.current.onScan([{ value: 'invalid-code' } as Code])
      })
      expect(result.current.errorMessage).toBe('Not a valid address')

      act(() => {
        result.current.onTryAgain()
      })

      expect(result.current.errorMessage).toBeNull()
      expect(result.current.isCameraActive).toBe(true)
    })

    it('does not scan again while the error overlay is shown', () => {
      mockResolveScannedAddress.mockReturnValue(null)

      const { result } = renderHook(() => useScan())
      activateCamera()

      act(() => {
        result.current.onScan([{ value: 'invalid-code' } as Code])
      })

      // Camera is paused, so a follow-up frame is ignored until Try again re-activates it.
      mockResolveScannedAddress.mockReturnValue({ address: '0xvalid' })
      act(() => {
        result.current.onScan([{ value: 'eth:0xvalid' } as Code])
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('does not wake the camera behind the error overlay when the screen refocuses', () => {
      mockResolveScannedAddress.mockReturnValue(null)

      const { result } = renderHook(() => useScan())
      activateCamera()

      act(() => {
        result.current.onScan([{ value: 'invalid-code' } as Code])
      })
      expect(result.current.errorMessage).toBe('Not a valid address')
      expect(result.current.isCameraActive).toBe(false)

      // Blur → refocus while the error is shown must not re-arm the camera behind the overlay.
      activateCamera()

      expect(result.current.isCameraActive).toBe(false)
      expect(result.current.errorMessage).toBe('Not a valid address')
    })
  })

  describe('Focus handling', () => {
    it('should reset hasScanned when screen gains focus', () => {
      const validAddress = '0x1234valid'
      mockResolveScannedAddress.mockReturnValue({ address: validAddress })

      const { result } = renderHook(() => useScan())

      // Manually trigger the focus effect to activate camera and reset hasScanned
      if (mockFocusCallback) {
        act(() => {
          const callback = mockFocusCallback as () => void
          callback()
        })
      }

      // First scan should work (camera is active and hasScanned is false)
      act(() => {
        result.current.onScan([{ value: `eth:${validAddress}` } as Code])
      })

      expect(mockPush).toHaveBeenCalledWith(`/(import-accounts)/form?safeAddress=${validAddress}`)

      // Clear mocks
      mockPush.mockClear()

      // Second scan should not work (hasScanned is now true)
      act(() => {
        result.current.onScan([{ value: `eth:${validAddress}` } as Code])
      })

      expect(mockPush).not.toHaveBeenCalled()

      // Trigger focus effect again to reset hasScanned
      if (mockFocusCallback) {
        act(() => {
          // We've already checked that mockFocusCallback is not null
          const callback = mockFocusCallback as () => void
          callback()
        })
      }

      // Now scanning should work again
      act(() => {
        result.current.onScan([{ value: `eth:${validAddress}` } as Code])
      })

      expect(mockPush).toHaveBeenCalledWith(`/(import-accounts)/form?safeAddress=${validAddress}`)
    })

    it('should handle camera permission properly', () => {
      // Test with no permission
      const mockUseCameraPermission = jest.mocked(require('react-native-vision-camera').useCameraPermission)
      mockUseCameraPermission.mockReturnValue({ hasPermission: false })

      const { result } = renderHook(() => useScan())

      // Try to trigger focus effect
      if (mockFocusCallback) {
        act(() => {
          const callback = mockFocusCallback as () => void
          callback()
        })
      }

      // Camera should not be active when there's no permission
      expect(result.current.isCameraActive).toBe(false)
    })
  })
})
