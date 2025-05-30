import { act, renderHook } from '@/src/tests/test-utils'
import { useScan } from './index'
import { Code } from 'react-native-vision-camera'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { isValidAddress } from '@safe-global/utils/utils/validation'

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

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback: () => (() => void) | void) => {
    mockFocusCallback = callback
    // Don't call the callback immediately - only store it for manual testing
  }),
}))

// Mock the global toastForValueShown object
const mockToastForValueShown: Record<string, boolean> = {}
// @ts-expect-error - intentionally extending global
global.toastForValueShown = mockToastForValueShown

jest.mock('@safe-global/utils/utils/addresses', () => ({
  parsePrefixedAddress: jest.fn().mockReturnValue({ address: 'mocked-address' }),
}))

jest.mock('@safe-global/utils/utils/validation', () => ({
  isValidAddress: jest.fn().mockReturnValue(false),
}))

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Toast
const mockShow = jest.fn()
jest.mock('@tamagui/toast', () => ({
  useToastController: () => ({
    show: mockShow,
  }),
}))

describe('useScan', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Clear the toast record
    Object.keys(mockToastForValueShown).forEach((key) => {
      mockToastForValueShown[key] = false
    })

    // Reset focus callback
    mockFocusCallback = null
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useScan())

    expect(result.current.isCameraActive).toBe(false) // Now false by default since focus effect isn't called
    expect(typeof result.current.setIsCameraActive).toBe('function')
    expect(typeof result.current.onScan).toBe('function')
  })

  describe('Toast handling', () => {
    it('should show toast for invalid address and not show duplicate toasts', () => {
      const invalidCode = 'invalid-code'

      jest.mocked(parsePrefixedAddress).mockReturnValue({ address: 'invalid-address' })
      jest.mocked(isValidAddress).mockReturnValue(false)

      const { result } = renderHook(() => useScan())

      // Manually trigger the focus effect to activate camera
      if (mockFocusCallback) {
        act(() => {
          const callback = mockFocusCallback as () => void
          callback()
        })
      }

      act(() => {
        result.current.onScan([{ value: invalidCode } as Code])
      })

      expect(mockShow).toHaveBeenCalledTimes(1)
      expect(mockShow).toHaveBeenCalledWith('Not a valid address', {
        native: false,
        duration: 2000,
      })

      mockShow.mockClear()

      act(() => {
        result.current.onScan([{ value: invalidCode } as Code])
      })

      expect(mockShow).not.toHaveBeenCalled()

      act(() => {
        result.current.onScan([{ value: 'another-invalid-code' } as Code])
      })

      expect(mockShow).toHaveBeenCalledTimes(1)
    })
  })

  describe('Focus handling', () => {
    it('should reset hasScanned when screen gains focus', () => {
      const validAddress = '0x1234valid'
      jest.mocked(parsePrefixedAddress).mockReturnValue({ address: validAddress })
      jest.mocked(isValidAddress).mockReturnValue(true)

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
