import { renderHook, act } from '@/src/tests/test-utils'
import { useLedgerDeviceScanning } from './useLedgerDeviceScanning'
import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'
import { useBluetoothStatus } from '@/src/features/Ledger/hooks/useBluetoothStatus'
import { faker } from '@faker-js/faker'
import type { DiscoveredDevice } from '@ledgerhq/device-management-kit'

// Mock the dependencies
jest.mock('@/src/services/ledger/ledger-dmk.service', () => ({
  ledgerDMKService: {
    startScanning: jest.fn(),
  },
}))

jest.mock('@/src/features/Ledger/hooks/useBluetoothStatus', () => ({
  useBluetoothStatus: jest.fn(),
}))

const mockLedgerDMKService = ledgerDMKService as jest.Mocked<typeof ledgerDMKService>
const mockUseBluetoothStatus = useBluetoothStatus as jest.MockedFunction<typeof useBluetoothStatus>

describe('useLedgerDeviceScanning', () => {
  let mockCleanupFunction: jest.Mock
  let mockCheckBluetoothStatus: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useFakeTimers()

    mockCleanupFunction = jest.fn()
    mockCheckBluetoothStatus = jest.fn()

    // Default mock for useBluetoothStatus
    mockUseBluetoothStatus.mockReturnValue({
      bluetoothEnabled: true,
      checkBluetoothStatus: mockCheckBluetoothStatus,
    })

    // Default mock for startScanning - return a fresh mock function each time
    mockLedgerDMKService.startScanning.mockImplementation(() => {
      const cleanup = jest.fn()
      // Copy the calls to the global mock for tracking
      cleanup.mockImplementation(() => {
        mockCleanupFunction()
      })
      return cleanup
    })
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  const createMockDevice = (overrides?: Partial<DiscoveredDevice>): DiscoveredDevice =>
    ({
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      deviceModel: { id: 'nanoS', productName: 'Ledger Nano S' },
      ...overrides,
    } as DiscoveredDevice)

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useLedgerDeviceScanning())

      expect(result.current.isScanning).toBe(false)
      expect(result.current.discoveredDevices).toEqual([])
      expect(result.current.bluetoothEnabled).toBe(true)
      expect(typeof result.current.startScanning).toBe('function')
      expect(typeof result.current.stopScanning).toBe('function')
      expect(typeof result.current.checkBluetoothStatus).toBe('function')
    })

    it('should reflect bluetooth status from useBluetoothStatus', () => {
      mockUseBluetoothStatus.mockReturnValue({
        bluetoothEnabled: false,
        checkBluetoothStatus: mockCheckBluetoothStatus,
      })

      const { result } = renderHook(() => useLedgerDeviceScanning())

      expect(result.current.bluetoothEnabled).toBe(false)
      expect(result.current.checkBluetoothStatus).toBe(mockCheckBluetoothStatus)
    })
  })

  describe('scanning lifecycle', () => {
    it('should start scanning when bluetooth is enabled', async () => {
      const { result } = renderHook(() => useLedgerDeviceScanning())

      await act(async () => {
        await result.current.startScanning()
      })

      expect(result.current.isScanning).toBe(true)
      expect(result.current.discoveredDevices).toEqual([])
      expect(mockLedgerDMKService.startScanning).toHaveBeenCalledTimes(1)
      expect(mockLedgerDMKService.startScanning).toHaveBeenCalledWith(
        expect.any(Function), // addDevice callback
        expect.any(Function), // handleScanError callback
      )
    })

    it('should not start scanning when bluetooth is disabled', async () => {
      mockUseBluetoothStatus.mockReturnValue({
        bluetoothEnabled: false,
        checkBluetoothStatus: mockCheckBluetoothStatus,
      })

      const { result } = renderHook(() => useLedgerDeviceScanning())

      await act(async () => {
        await result.current.startScanning()
      })

      expect(result.current.isScanning).toBe(false)
      expect(mockLedgerDMKService.startScanning).not.toHaveBeenCalled()
    })

    it('should stop scanning and call cleanup function', async () => {
      const { result, unmount } = renderHook(() => useLedgerDeviceScanning())

      // Start scanning first
      await act(async () => {
        await result.current.startScanning()
      })

      expect(result.current.isScanning).toBe(true)

      // Stop scanning
      act(() => {
        result.current.stopScanning()
      })

      expect(result.current.isScanning).toBe(false)
      expect(mockCleanupFunction).toHaveBeenCalled()

      unmount()
    })

    it('should reset state when starting new scan', async () => {
      const { result } = renderHook(() => useLedgerDeviceScanning())

      // Start scanning and add a device
      await act(async () => {
        await result.current.startScanning()
      })

      // Simulate device discovery
      const mockDevice = createMockDevice()
      const addDeviceCallback = mockLedgerDMKService.startScanning.mock.calls[0][0]

      act(() => {
        addDeviceCallback(mockDevice)
      })

      expect(result.current.discoveredDevices).toHaveLength(1)

      // Start scanning again
      await act(async () => {
        await result.current.startScanning()
      })

      expect(result.current.discoveredDevices).toEqual([])
      expect(result.current.isScanning).toBe(true)
    })
  })

  describe('device discovery', () => {
    it('should add discovered devices to the list', async () => {
      const { result } = renderHook(() => useLedgerDeviceScanning())

      await act(async () => {
        await result.current.startScanning()
      })

      const mockDevice1 = createMockDevice({ id: 'device-1', name: 'Ledger Nano S' })
      const mockDevice2 = createMockDevice({ id: 'device-2', name: 'Ledger Nano X' })

      const addDeviceCallback = mockLedgerDMKService.startScanning.mock.calls[0][0]

      act(() => {
        addDeviceCallback(mockDevice1)
      })

      expect(result.current.discoveredDevices).toHaveLength(1)
      expect(result.current.discoveredDevices[0]).toEqual({
        id: 'device-1',
        name: 'Ledger Nano S',
        device: mockDevice1,
      })

      act(() => {
        addDeviceCallback(mockDevice2)
      })

      expect(result.current.discoveredDevices).toHaveLength(2)
      expect(result.current.discoveredDevices[1]).toEqual({
        id: 'device-2',
        name: 'Ledger Nano X',
        device: mockDevice2,
      })
    })

    it('should not add duplicate devices', async () => {
      const { result } = renderHook(() => useLedgerDeviceScanning())

      await act(async () => {
        await result.current.startScanning()
      })

      const mockDevice = createMockDevice({ id: 'device-1', name: 'Ledger Nano S' })
      const addDeviceCallback = mockLedgerDMKService.startScanning.mock.calls[0][0]

      act(() => {
        addDeviceCallback(mockDevice)
      })

      expect(result.current.discoveredDevices).toHaveLength(1)

      // Try to add the same device again
      act(() => {
        addDeviceCallback(mockDevice)
      })

      expect(result.current.discoveredDevices).toHaveLength(1)
    })

    it('should use default name when device name is not provided', async () => {
      const { result } = renderHook(() => useLedgerDeviceScanning())

      await act(async () => {
        await result.current.startScanning()
      })

      const mockDevice = createMockDevice({ id: 'device-1', name: undefined })
      const addDeviceCallback = mockLedgerDMKService.startScanning.mock.calls[0][0]

      act(() => {
        addDeviceCallback(mockDevice)
      })

      expect(result.current.discoveredDevices[0].name).toBe('Ledger Device')
    })
  })

  describe('auto-stop scanning after first device', () => {
    it('should auto-stop scanning 10 seconds after finding first device', async () => {
      const { result, unmount } = renderHook(() => useLedgerDeviceScanning())

      await act(async () => {
        await result.current.startScanning()
      })

      const mockDevice = createMockDevice()
      const addDeviceCallback = mockLedgerDMKService.startScanning.mock.calls[0][0]

      // Add first device
      act(() => {
        addDeviceCallback(mockDevice)
      })

      expect(result.current.isScanning).toBe(true)

      // Fast-forward 9 seconds - should still be scanning
      act(() => {
        jest.advanceTimersByTime(9000)
      })

      expect(result.current.isScanning).toBe(true)

      // Fast-forward to 10 seconds - should stop scanning
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current.isScanning).toBe(false)
      expect(mockCleanupFunction).toHaveBeenCalled()

      unmount()
    })

    it('should not auto-stop if scanning was manually stopped before timeout', async () => {
      const { result, unmount } = renderHook(() => useLedgerDeviceScanning())

      await act(async () => {
        await result.current.startScanning()
      })

      const mockDevice = createMockDevice()
      const addDeviceCallback = mockLedgerDMKService.startScanning.mock.calls[0][0]

      // Add first device
      act(() => {
        addDeviceCallback(mockDevice)
      })

      // Manually stop scanning after 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000)
        result.current.stopScanning()
      })

      expect(result.current.isScanning).toBe(false)

      // Fast-forward past the 10-second mark
      act(() => {
        jest.advanceTimersByTime(6000)
      })

      // Should still be stopped
      expect(result.current.isScanning).toBe(false)

      unmount()
    })

    it('should clear auto-stop timeout when scanning is restarted', async () => {
      const { result } = renderHook(() => useLedgerDeviceScanning())

      await act(async () => {
        await result.current.startScanning()
      })

      const mockDevice = createMockDevice()
      const addDeviceCallback = mockLedgerDMKService.startScanning.mock.calls[0][0]

      // Add first device
      act(() => {
        addDeviceCallback(mockDevice)
      })

      // Wait 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      // Restart scanning
      await act(async () => {
        await result.current.startScanning()
      })

      // Fast-forward past original 10-second mark
      act(() => {
        jest.advanceTimersByTime(6000)
      })

      // Should still be scanning (timeout was cleared)
      expect(result.current.isScanning).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle scanning errors and stop scanning', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const { result } = renderHook(() => useLedgerDeviceScanning())

      await act(async () => {
        await result.current.startScanning()
      })

      const handleScanErrorCallback = mockLedgerDMKService.startScanning.mock.calls[0][1]
      const mockError = new Error('Bluetooth connection failed')

      act(() => {
        handleScanErrorCallback(mockError)
      })

      expect(result.current.isScanning).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Scanning error:', mockError)

      consoleSpy.mockRestore()
    })
  })

  describe('cleanup and unmounting', () => {
    it('should cleanup scanning on unmount', async () => {
      const { result, unmount } = renderHook(() => useLedgerDeviceScanning())

      // Start scanning
      await act(async () => {
        await result.current.startScanning()
      })

      expect(mockLedgerDMKService.startScanning).toHaveBeenCalled()

      // Unmount component
      unmount()

      expect(mockCleanupFunction).toHaveBeenCalledTimes(1)
    })

    it('should not call cleanup on unmount if not scanning', () => {
      const { unmount } = renderHook(() => useLedgerDeviceScanning())

      // Unmount without starting scan
      unmount()

      expect(mockCleanupFunction).not.toHaveBeenCalled()
    })
  })

  describe('function reference stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useLedgerDeviceScanning())

      const firstStartScanning = result.current.startScanning
      const firstStopScanning = result.current.stopScanning
      const firstCheckBluetoothStatus = result.current.checkBluetoothStatus

      rerender({})

      expect(result.current.startScanning).toBe(firstStartScanning)
      expect(result.current.stopScanning).toBe(firstStopScanning)
      expect(result.current.checkBluetoothStatus).toBe(firstCheckBluetoothStatus)
    })

    it('should update startScanning when bluetooth status changes', () => {
      const { result, rerender } = renderHook(() => useLedgerDeviceScanning())

      const firstStartScanning = result.current.startScanning

      // Change bluetooth status
      mockUseBluetoothStatus.mockReturnValue({
        bluetoothEnabled: false,
        checkBluetoothStatus: mockCheckBluetoothStatus,
      })

      rerender({})

      // startScanning should have new reference due to bluetoothEnabled dependency
      expect(result.current.startScanning).not.toBe(firstStartScanning)
    })
  })

  describe('state isolation', () => {
    it('should maintain independent state between hook instances', async () => {
      const { result: result1 } = renderHook(() => useLedgerDeviceScanning())
      const { result: result2 } = renderHook(() => useLedgerDeviceScanning())

      // Start scanning on first instance
      await act(async () => {
        await result1.current.startScanning()
      })

      expect(result1.current.isScanning).toBe(true)
      expect(result2.current.isScanning).toBe(false)

      // Add device to first instance
      const mockDevice = createMockDevice()
      const addDeviceCallback1 = mockLedgerDMKService.startScanning.mock.calls[0][0]

      act(() => {
        addDeviceCallback1(mockDevice)
      })

      expect(result1.current.discoveredDevices).toHaveLength(1)
      expect(result2.current.discoveredDevices).toHaveLength(0)
    })
  })

  describe('edge cases', () => {
    it('should handle stopping scanning when not started', () => {
      const { result } = renderHook(() => useLedgerDeviceScanning())

      // Try to stop scanning without starting
      act(() => {
        result.current.stopScanning()
      })

      expect(result.current.isScanning).toBe(false)
      expect(mockCleanupFunction).not.toHaveBeenCalled()
    })

    it('should handle multiple start scanning calls', async () => {
      const { result } = renderHook(() => useLedgerDeviceScanning())

      // Start scanning multiple times rapidly
      await act(async () => {
        await result.current.startScanning()
        await result.current.startScanning()
        await result.current.startScanning()
      })

      expect(result.current.isScanning).toBe(true)
      // Should have been called 3 times (once for each start)
      expect(mockLedgerDMKService.startScanning).toHaveBeenCalledTimes(3)
    })

    it('should handle bluetooth status changing during scanning', async () => {
      const { result, rerender } = renderHook(() => useLedgerDeviceScanning())

      // Start scanning with bluetooth enabled
      await act(async () => {
        await result.current.startScanning()
      })

      expect(result.current.isScanning).toBe(true)

      // Change bluetooth status to disabled
      mockUseBluetoothStatus.mockReturnValue({
        bluetoothEnabled: false,
        checkBluetoothStatus: mockCheckBluetoothStatus,
      })

      rerender({})

      expect(result.current.bluetoothEnabled).toBe(false)
      // Scanning state should remain as it was started before bluetooth was disabled
      expect(result.current.isScanning).toBe(true)
    })

    it('should handle device discovery after scanning stopped', async () => {
      const { result } = renderHook(() => useLedgerDeviceScanning())

      await act(async () => {
        await result.current.startScanning()
      })

      const addDeviceCallback = mockLedgerDMKService.startScanning.mock.calls[0][0]

      // Stop scanning
      act(() => {
        result.current.stopScanning()
      })

      expect(result.current.isScanning).toBe(false)

      // Try to add device after stopping (shouldn't affect state)
      const mockDevice = createMockDevice()
      act(() => {
        addDeviceCallback(mockDevice)
      })

      expect(result.current.discoveredDevices).toHaveLength(1) // Device is still added via callback
      expect(result.current.isScanning).toBe(false)
    })
  })

  describe('bluetooth status integration', () => {
    it('should pass through bluetooth status and check function', () => {
      const mockCustomCheckFunction = jest.fn()

      mockUseBluetoothStatus.mockReturnValue({
        bluetoothEnabled: null,
        checkBluetoothStatus: mockCustomCheckFunction,
      })

      const { result } = renderHook(() => useLedgerDeviceScanning())

      expect(result.current.bluetoothEnabled).toBeNull()
      expect(result.current.checkBluetoothStatus).toBe(mockCustomCheckFunction)
    })
  })
})
