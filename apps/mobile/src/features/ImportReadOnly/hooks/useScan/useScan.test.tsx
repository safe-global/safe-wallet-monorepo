import { act, renderHook } from '@/src/tests/test-utils'
import { useScan } from './index'
import { Code } from 'react-native-vision-camera'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { isValidAddress } from '@safe-global/utils/utils/validation'

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
jest.mock('expo-router', () => {
  return {
    useRouter: () => ({
      push: mockPush,
    }),
  }
})

// Store the focus callback for later testing
let mockFocusCallback: (() => void) | null = null

jest.mock('@react-navigation/native', () => {
  return {
    useFocusEffect: jest.fn((callback: () => void) => {
      mockFocusCallback = callback
    }),
  }
})

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

    expect(result.current.isCameraActive).toBe(false)
    expect(typeof result.current.setIsCameraActive).toBe('function')
    expect(typeof result.current.onScan).toBe('function')
  })

  describe('Toast handling', () => {
    it('should show toast for invalid address and not show duplicate toasts', () => {
      const invalidCode = 'invalid-code'

      jest.mocked(parsePrefixedAddress).mockReturnValue({ address: 'invalid-address' })
      jest.mocked(isValidAddress).mockReturnValue(false)

      const { result } = renderHook(() => useScan())

      act(() => {
        result.current.setIsCameraActive(true)
      })

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

      // Ensure focus listener was set up
      expect(mockFocusCallback).not.toBeNull()

      act(() => {
        result.current.setIsCameraActive(true)
      })

      act(() => {
        result.current.onScan([{ value: `eth:${validAddress}` } as Code])
      })

      expect(mockPush).toHaveBeenCalledWith(`/(import-accounts)/form?safeAddress=${validAddress}`)

      mockPush.mockClear()

      jest.mocked(parsePrefixedAddress).mockClear()
      jest.mocked(isValidAddress).mockClear()

      act(() => {
        result.current.setIsCameraActive(true)
      })

      act(() => {
        result.current.onScan([{ value: `eth:${validAddress}` } as Code])
      })

      expect(mockPush).not.toHaveBeenCalled()

      const focusCallback = mockFocusCallback as () => void
      act(() => {
        focusCallback()
      })

      act(() => {
        result.current.setIsCameraActive(true)
      })

      act(() => {
        result.current.onScan([{ value: `eth:${validAddress}` } as Code])
      })

      expect(mockPush).toHaveBeenCalledWith(`/(import-accounts)/form?safeAddress=${validAddress}`)
    })
  })
})
