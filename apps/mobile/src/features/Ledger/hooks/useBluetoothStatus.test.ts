import { renderHook, act } from '@/src/tests/test-utils'
import { useBluetoothStatus } from './useBluetoothStatus'
import { bluetoothService } from '@/src/services/bluetooth/bluetooth.service'
import { RESULTS } from 'react-native-permissions'
import logger from '@/src/utils/logger'

// Mock the bluetooth service
jest.mock('@/src/services/bluetooth/bluetooth.service', () => ({
  bluetoothService: {
    checkBluetoothPermission: jest.fn(),
    requestBluetoothPermissions: jest.fn(),
    openDeviceSettings: jest.fn(),
  },
}))

const mockBluetoothService = bluetoothService as jest.Mocked<typeof bluetoothService>

describe('useBluetoothStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with null states', () => {
      mockBluetoothService.checkBluetoothPermission.mockResolvedValue(RESULTS.GRANTED)

      const { result } = renderHook(() => useBluetoothStatus())

      expect(result.current.permissionGranted).toBeNull()
      expect(result.current.permissionStatus).toBeNull()
      expect(result.current.error).toBeNull()
      expect(typeof result.current.checkBluetoothPermission).toBe('function')
      expect(typeof result.current.requestBluetoothPermissions).toBe('function')
      expect(typeof result.current.openDeviceSettings).toBe('function')
    })

    it('should NOT check permission on mount (lazy initialization)', async () => {
      mockBluetoothService.checkBluetoothPermission.mockResolvedValue(RESULTS.GRANTED)

      const { result } = renderHook(() => useBluetoothStatus())

      // Should not auto-check on mount to prevent early permission prompts
      expect(result.current.permissionGranted).toBeNull()
      expect(mockBluetoothService.checkBluetoothPermission).not.toHaveBeenCalled()
    })
  })

  describe('permission checking', () => {
    it('should check bluetooth permission when requested - GRANTED', async () => {
      mockBluetoothService.checkBluetoothPermission.mockResolvedValue(RESULTS.GRANTED)

      const { result } = renderHook(() => useBluetoothStatus())

      await act(async () => {
        const isGranted = await result.current.checkBluetoothPermission()
        expect(isGranted).toBe(true)
      })

      expect(result.current.permissionGranted).toBe(true)
      expect(result.current.permissionStatus).toBe(RESULTS.GRANTED)
      expect(result.current.error).toBeNull()
      expect(mockBluetoothService.checkBluetoothPermission).toHaveBeenCalledTimes(1)
    })

    it('should check bluetooth permission when requested - LIMITED', async () => {
      mockBluetoothService.checkBluetoothPermission.mockResolvedValue(RESULTS.LIMITED)

      const { result } = renderHook(() => useBluetoothStatus())

      await act(async () => {
        const isGranted = await result.current.checkBluetoothPermission()
        expect(isGranted).toBe(true)
      })

      expect(result.current.permissionGranted).toBe(true)
      expect(result.current.permissionStatus).toBe(RESULTS.LIMITED)
      expect(result.current.error).toBeNull()
    })

    it('should check bluetooth permission when requested - DENIED', async () => {
      mockBluetoothService.checkBluetoothPermission.mockResolvedValue(RESULTS.DENIED)

      const { result } = renderHook(() => useBluetoothStatus())

      await act(async () => {
        const isGranted = await result.current.checkBluetoothPermission()
        expect(isGranted).toBe(false)
      })

      expect(result.current.permissionGranted).toBe(false)
      expect(result.current.permissionStatus).toBe(RESULTS.DENIED)
      expect(result.current.error).toBeNull()
    })

    it('should check bluetooth permission when requested - BLOCKED', async () => {
      mockBluetoothService.checkBluetoothPermission.mockResolvedValue(RESULTS.BLOCKED)

      const { result } = renderHook(() => useBluetoothStatus())

      await act(async () => {
        const isGranted = await result.current.checkBluetoothPermission()
        expect(isGranted).toBe(false)
      })

      expect(result.current.permissionGranted).toBe(false)
      expect(result.current.permissionStatus).toBe(RESULTS.BLOCKED)
      expect(result.current.error).toBeNull()
    })

    it('should handle permission check errors', async () => {
      const mockError = new Error('Permission check error')
      mockBluetoothService.checkBluetoothPermission.mockRejectedValue(mockError)

      const { result } = renderHook(() => useBluetoothStatus())

      await act(async () => {
        const isGranted = await result.current.checkBluetoothPermission()
        expect(isGranted).toBe(false)
      })

      expect(result.current.permissionGranted).toBe(false)
      expect(result.current.permissionStatus).toBeNull()
      expect(result.current.error).toBe('Permission check error')
      expect(logger.error).toHaveBeenCalledWith('Error checking Bluetooth permission:', mockError)
    })
  })

  describe('permission requests', () => {
    it('should request bluetooth permissions successfully', async () => {
      const mockResult = { granted: true }
      mockBluetoothService.requestBluetoothPermissions.mockResolvedValue(mockResult)
      mockBluetoothService.checkBluetoothPermission.mockResolvedValue(RESULTS.GRANTED)

      const { result } = renderHook(() => useBluetoothStatus())

      await act(async () => {
        const permissionResult = await result.current.requestBluetoothPermissions()
        expect(permissionResult).toEqual(mockResult)
      })

      expect(result.current.permissionGranted).toBe(true)
      expect(result.current.permissionStatus).toBe(RESULTS.GRANTED)
      expect(result.current.error).toBeNull()
      expect(mockBluetoothService.requestBluetoothPermissions).toHaveBeenCalledTimes(1)
      expect(mockBluetoothService.checkBluetoothPermission).toHaveBeenCalledTimes(1)
    })

    it('should handle permission denied', async () => {
      const mockResult = {
        granted: false,
        error: 'User denied permissions',
      }
      mockBluetoothService.requestBluetoothPermissions.mockResolvedValue(mockResult)
      mockBluetoothService.checkBluetoothPermission.mockResolvedValue(RESULTS.DENIED)

      const { result } = renderHook(() => useBluetoothStatus())

      await act(async () => {
        const permissionResult = await result.current.requestBluetoothPermissions()
        expect(permissionResult).toEqual(mockResult)
      })

      expect(result.current.permissionGranted).toBe(false)
      expect(result.current.permissionStatus).toBe(RESULTS.DENIED)
      expect(result.current.error).toBe('User denied permissions')
    })

    it('should handle permission blocked', async () => {
      const mockResult = {
        granted: false,
        error: 'Bluetooth permission is blocked. Please enable it in your device settings.',
      }
      mockBluetoothService.requestBluetoothPermissions.mockResolvedValue(mockResult)
      mockBluetoothService.checkBluetoothPermission.mockResolvedValue(RESULTS.BLOCKED)

      const { result } = renderHook(() => useBluetoothStatus())

      await act(async () => {
        const permissionResult = await result.current.requestBluetoothPermissions()
        expect(permissionResult).toEqual(mockResult)
      })

      expect(result.current.permissionGranted).toBe(false)
      expect(result.current.permissionStatus).toBe(RESULTS.BLOCKED)
      expect(result.current.error).toBe('Bluetooth permission is blocked. Please enable it in your device settings.')
    })

    it('should handle request permission errors', async () => {
      const mockError = new Error('Permission request failed')
      mockBluetoothService.requestBluetoothPermissions.mockRejectedValue(mockError)

      const { result } = renderHook(() => useBluetoothStatus())

      await act(async () => {
        const permissionResult = await result.current.requestBluetoothPermissions()
        expect(permissionResult).toEqual({
          granted: false,
          error: 'Permission request failed',
        })
      })

      expect(result.current.permissionGranted).toBe(false)
      expect(result.current.permissionStatus).toBeNull()
      expect(result.current.error).toBe('Permission request failed')
      expect(logger.error).toHaveBeenCalledWith('Error requesting Bluetooth permissions:', mockError)
    })

    it('should open device settings', async () => {
      mockBluetoothService.openDeviceSettings.mockResolvedValue()

      const { result } = renderHook(() => useBluetoothStatus())

      await act(async () => {
        await result.current.openDeviceSettings()
      })

      expect(mockBluetoothService.openDeviceSettings).toHaveBeenCalledTimes(1)
    })
  })

  describe('state updates', () => {
    it('should update permission status when it changes from granted to denied', async () => {
      // Start with permission granted
      mockBluetoothService.checkBluetoothPermission.mockResolvedValue(RESULTS.GRANTED)

      const { result } = renderHook(() => useBluetoothStatus())

      // Check initial status
      await act(async () => {
        await result.current.checkBluetoothPermission()
      })

      expect(result.current.permissionGranted).toBe(true)
      expect(result.current.permissionStatus).toBe(RESULTS.GRANTED)

      // Change permission status to denied
      mockBluetoothService.checkBluetoothPermission.mockResolvedValue(RESULTS.DENIED)

      // Check status again
      await act(async () => {
        await result.current.checkBluetoothPermission()
      })

      expect(result.current.permissionGranted).toBe(false)
      expect(result.current.permissionStatus).toBe(RESULTS.DENIED)
    })

    it('should update permission status when it changes from denied to granted', async () => {
      // Start with permission denied
      mockBluetoothService.checkBluetoothPermission.mockResolvedValue(RESULTS.DENIED)

      const { result } = renderHook(() => useBluetoothStatus())

      // Check initial status
      await act(async () => {
        await result.current.checkBluetoothPermission()
      })

      expect(result.current.permissionGranted).toBe(false)
      expect(result.current.permissionStatus).toBe(RESULTS.DENIED)

      // Change permission status to granted
      mockBluetoothService.checkBluetoothPermission.mockResolvedValue(RESULTS.GRANTED)

      // Check status again
      await act(async () => {
        await result.current.checkBluetoothPermission()
      })

      expect(result.current.permissionGranted).toBe(true)
      expect(result.current.permissionStatus).toBe(RESULTS.GRANTED)
    })
  })

  describe('function reference stability', () => {
    it('should maintain stable function references', async () => {
      mockBluetoothService.checkBluetoothPermission.mockResolvedValue(RESULTS.GRANTED)

      const { result, rerender } = renderHook(() => useBluetoothStatus())

      const firstCheckFunction = result.current.checkBluetoothPermission
      const firstRequestFunction = result.current.requestBluetoothPermissions
      const firstOpenSettingsFunction = result.current.openDeviceSettings

      // Rerender and check function reference stability
      rerender({})

      expect(result.current.checkBluetoothPermission).toBe(firstCheckFunction)
      expect(result.current.requestBluetoothPermissions).toBe(firstRequestFunction)
      expect(result.current.openDeviceSettings).toBe(firstOpenSettingsFunction)
    })
  })

  describe('complex permission flow', () => {
    it('should handle complete permission flow: check -> request -> check again', async () => {
      // Initially permission is not granted
      mockBluetoothService.checkBluetoothPermission.mockResolvedValueOnce(RESULTS.DENIED)

      const { result } = renderHook(() => useBluetoothStatus())

      // Check initial permission
      await act(async () => {
        const isGranted = await result.current.checkBluetoothPermission()
        expect(isGranted).toBe(false)
      })

      expect(result.current.permissionStatus).toBe(RESULTS.DENIED)

      // Request permission (user grants it)
      mockBluetoothService.requestBluetoothPermissions.mockResolvedValue({ granted: true })
      mockBluetoothService.checkBluetoothPermission.mockResolvedValue(RESULTS.GRANTED)

      await act(async () => {
        const permissionResult = await result.current.requestBluetoothPermissions()
        expect(permissionResult.granted).toBe(true)
      })

      expect(result.current.permissionGranted).toBe(true)
      expect(result.current.permissionStatus).toBe(RESULTS.GRANTED)
      expect(result.current.error).toBeNull()
    })
  })
})
