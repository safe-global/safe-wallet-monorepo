import { renderHook, waitFor, act } from '@/src/tests/test-utils'
import { useBluetoothStatus } from './useBluetoothStatus'
import { bluetoothService } from '@/src/services/bluetooth/bluetooth.service'

// Mock the bluetooth service
jest.mock('@/src/services/bluetooth/bluetooth.service', () => ({
  bluetoothService: {
    isBluetoothEnabled: jest.fn(),
  },
}))

const mockBluetoothService = bluetoothService as jest.Mocked<typeof bluetoothService>

describe('useBluetoothStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear console.error mock calls
    jest.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('initial state and bluetooth check', () => {
    it('should initialize with null bluetoothEnabled state', () => {
      mockBluetoothService.isBluetoothEnabled.mockResolvedValue(true)

      const { result } = renderHook(() => useBluetoothStatus())

      expect(result.current.bluetoothEnabled).toBeNull()
      expect(typeof result.current.checkBluetoothStatus).toBe('function')
    })

    it('should check bluetooth status on mount and set enabled to true', async () => {
      mockBluetoothService.isBluetoothEnabled.mockResolvedValue(true)

      const { result } = renderHook(() => useBluetoothStatus())

      await waitFor(() => {
        expect(result.current.bluetoothEnabled).toBe(true)
      })

      expect(mockBluetoothService.isBluetoothEnabled).toHaveBeenCalledTimes(1)
    })

    it('should check bluetooth status on mount and set enabled to false', async () => {
      mockBluetoothService.isBluetoothEnabled.mockResolvedValue(false)

      const { result } = renderHook(() => useBluetoothStatus())

      await waitFor(() => {
        expect(result.current.bluetoothEnabled).toBe(false)
      })

      expect(mockBluetoothService.isBluetoothEnabled).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('should handle bluetooth service errors and set enabled to false', async () => {
      const mockError = new Error('Bluetooth service error')
      mockBluetoothService.isBluetoothEnabled.mockRejectedValue(mockError)

      const { result } = renderHook(() => useBluetoothStatus())

      await waitFor(() => {
        expect(result.current.bluetoothEnabled).toBe(false)
      })

      expect(mockBluetoothService.isBluetoothEnabled).toHaveBeenCalledTimes(1)
      expect(console.error).toHaveBeenCalledWith('Error checking Bluetooth status:', mockError)
    })

    it('should handle bluetooth service rejection and log error', async () => {
      const mockError = new Error('Permission denied')
      mockBluetoothService.isBluetoothEnabled.mockRejectedValue(mockError)

      const { result } = renderHook(() => useBluetoothStatus())

      await waitFor(() => {
        expect(result.current.bluetoothEnabled).toBe(false)
      })

      expect(console.error).toHaveBeenCalledWith('Error checking Bluetooth status:', mockError)
    })
  })

  describe('manual bluetooth status check', () => {
    it('should allow manual bluetooth status check and return true', async () => {
      mockBluetoothService.isBluetoothEnabled.mockResolvedValue(true)

      const { result } = renderHook(() => useBluetoothStatus())

      // Wait for initial check to complete
      await waitFor(() => {
        expect(result.current.bluetoothEnabled).toBe(true)
      })

      // Clear previous calls
      mockBluetoothService.isBluetoothEnabled.mockClear()

      // Mock return false for manual check
      mockBluetoothService.isBluetoothEnabled.mockResolvedValue(false)

      let manualCheckResult: boolean | undefined
      await act(async () => {
        manualCheckResult = await result.current.checkBluetoothStatus()
      })

      expect(manualCheckResult).toBe(false)
      expect(result.current.bluetoothEnabled).toBe(false)
      expect(mockBluetoothService.isBluetoothEnabled).toHaveBeenCalledTimes(1)
    })

    it('should allow manual bluetooth status check and return false on error', async () => {
      mockBluetoothService.isBluetoothEnabled.mockResolvedValue(true)

      const { result } = renderHook(() => useBluetoothStatus())

      // Wait for initial check to complete
      await waitFor(() => {
        expect(result.current.bluetoothEnabled).toBe(true)
      })

      // Clear previous calls and mock error for manual check
      mockBluetoothService.isBluetoothEnabled.mockClear()
      const mockError = new Error('Manual check error')
      mockBluetoothService.isBluetoothEnabled.mockRejectedValue(mockError)

      let manualCheckResult: boolean | undefined
      await act(async () => {
        manualCheckResult = await result.current.checkBluetoothStatus()
      })

      expect(manualCheckResult).toBe(false)
      expect(result.current.bluetoothEnabled).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Error checking Bluetooth status:', mockError)
    })

    it('should maintain stable checkBluetoothStatus function reference', async () => {
      mockBluetoothService.isBluetoothEnabled.mockResolvedValue(true)

      const { result, rerender } = renderHook(() => useBluetoothStatus())

      const firstCheckFunction = result.current.checkBluetoothStatus

      // Wait for initial check
      await waitFor(() => {
        expect(result.current.bluetoothEnabled).toBe(true)
      })

      // Rerender and check function reference stability
      rerender({})

      expect(result.current.checkBluetoothStatus).toBe(firstCheckFunction)
    })
  })

  describe('state updates', () => {
    it('should update state when bluetooth status changes from enabled to disabled', async () => {
      // Start with bluetooth enabled
      mockBluetoothService.isBluetoothEnabled.mockResolvedValue(true)

      const { result } = renderHook(() => useBluetoothStatus())

      // Wait for initial state
      await waitFor(() => {
        expect(result.current.bluetoothEnabled).toBe(true)
      })

      // Change bluetooth status to disabled
      mockBluetoothService.isBluetoothEnabled.mockResolvedValue(false)

      // Manually check status
      await act(async () => {
        await result.current.checkBluetoothStatus()
      })

      expect(result.current.bluetoothEnabled).toBe(false)
    })

    it('should update state when bluetooth status changes from disabled to enabled', async () => {
      // Start with bluetooth disabled
      mockBluetoothService.isBluetoothEnabled.mockResolvedValue(false)

      const { result } = renderHook(() => useBluetoothStatus())

      // Wait for initial state
      await waitFor(() => {
        expect(result.current.bluetoothEnabled).toBe(false)
      })

      // Change bluetooth status to enabled
      mockBluetoothService.isBluetoothEnabled.mockResolvedValue(true)

      // Manually check status
      await act(async () => {
        await result.current.checkBluetoothStatus()
      })

      expect(result.current.bluetoothEnabled).toBe(true)
    })
  })

  describe('useEffect dependency', () => {
    it('should only call bluetooth check once on mount', async () => {
      mockBluetoothService.isBluetoothEnabled.mockResolvedValue(true)

      const { rerender } = renderHook(() => useBluetoothStatus())

      // Wait for initial check
      await waitFor(() => {
        expect(mockBluetoothService.isBluetoothEnabled).toHaveBeenCalledTimes(1)
      })

      // Rerender should not trigger additional checks
      rerender({})
      rerender({})

      // Should still only be called once
      expect(mockBluetoothService.isBluetoothEnabled).toHaveBeenCalledTimes(1)
    })
  })
})
