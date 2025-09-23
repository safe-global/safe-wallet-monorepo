import { renderHook, waitFor, act } from '@/src/tests/test-utils'
import { useLedgerConnection } from './useLedgerConnection'
import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'
import { faker } from '@faker-js/faker'
import type { DiscoveredDevice, DeviceSessionId } from '@ledgerhq/device-management-kit'

// Mock the ledger DMK service
jest.mock('@/src/services/ledger/ledger-dmk.service', () => ({
  ledgerDMKService: {
    connectToDevice: jest.fn(),
  },
}))

const mockLedgerDMKService = ledgerDMKService as jest.Mocked<typeof ledgerDMKService>

// Type for LedgerDevice (matches the interface in the hook file)
interface LedgerDevice {
  id: string
  name: string
  device: DiscoveredDevice
}

describe('useLedgerConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockLedgerDevice = (): LedgerDevice => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    device: {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
    } as DiscoveredDevice,
  })

  const createMockSessionId = (): DeviceSessionId => faker.string.uuid() as DeviceSessionId

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useLedgerConnection())

      expect(result.current.isConnecting).toBe(false)
      expect(result.current.connectionError).toBeNull()
      expect(result.current.session).toBeNull()
      expect(typeof result.current.connectToDevice).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
      expect(typeof result.current.clearSession).toBe('function')
    })
  })

  describe('successful device connection', () => {
    it('should successfully connect to device and return session', async () => {
      const mockDevice = createMockLedgerDevice()
      const mockSessionId = createMockSessionId()

      mockLedgerDMKService.connectToDevice.mockResolvedValue(mockSessionId)

      const { result } = renderHook(() => useLedgerConnection())

      let connectionResult: DeviceSessionId | null = null
      await act(async () => {
        connectionResult = await result.current.connectToDevice(mockDevice)
      })

      expect(connectionResult).toBe(mockSessionId)
      expect(result.current.session).toBe(mockSessionId)
      expect(result.current.isConnecting).toBe(false)
      expect(result.current.connectionError).toBeNull()
      expect(mockLedgerDMKService.connectToDevice).toHaveBeenCalledWith(mockDevice.device)
    })

    it('should clear previous error and session when starting new connection', async () => {
      const mockDevice = createMockLedgerDevice()
      const mockSessionId = createMockSessionId()

      // First, create an error state
      mockLedgerDMKService.connectToDevice.mockRejectedValueOnce(new Error('Connection failed'))

      const { result } = renderHook(() => useLedgerConnection())

      // Create error state
      await act(async () => {
        await result.current.connectToDevice(mockDevice)
      })

      expect(result.current.connectionError).not.toBeNull()

      // Now make a successful connection
      mockLedgerDMKService.connectToDevice.mockResolvedValue(mockSessionId)

      await act(async () => {
        await result.current.connectToDevice(mockDevice)
      })

      expect(result.current.connectionError).toBeNull()
      expect(result.current.session).toBe(mockSessionId)
    })
  })

  describe('connection loading states', () => {
    it('should set isConnecting to true during connection process', async () => {
      const mockDevice = createMockLedgerDevice()
      let resolveConnection: ((sessionId: DeviceSessionId) => void) | undefined
      const connectionPromise = new Promise<DeviceSessionId>((resolve) => {
        resolveConnection = resolve
      })

      mockLedgerDMKService.connectToDevice.mockReturnValue(connectionPromise)

      const { result } = renderHook(() => useLedgerConnection())

      // Start connection
      let connectPromise: Promise<DeviceSessionId | null>
      await act(async () => {
        connectPromise = result.current.connectToDevice(mockDevice)
      })

      // Check loading state
      await waitFor(() => {
        expect(result.current.isConnecting).toBe(true)
      })

      // Verify state during connection
      expect(result.current.connectionError).toBeNull()
      expect(result.current.session).toBeNull()

      // Complete connection
      const mockSessionId = createMockSessionId()
      if (resolveConnection) {
        resolveConnection(mockSessionId)
      }
      await act(async () => {
        await connectPromise
      })

      expect(result.current.isConnecting).toBe(false)
      expect(result.current.session).toBe(mockSessionId)
    })

    it('should set isConnecting to false after connection failure', async () => {
      const mockDevice = createMockLedgerDevice()
      let rejectConnection: ((error: Error) => void) | undefined
      const connectionPromise = new Promise<DeviceSessionId>((_, reject) => {
        rejectConnection = reject
      })

      mockLedgerDMKService.connectToDevice.mockReturnValue(connectionPromise)

      const { result } = renderHook(() => useLedgerConnection())

      // Start connection
      const connectPromise = result.current.connectToDevice(mockDevice)

      // Wait for loading state
      await waitFor(() => {
        expect(result.current.isConnecting).toBe(true)
      })

      // Fail connection
      if (rejectConnection) {
        rejectConnection(new Error('Connection failed'))
      }
      await act(async () => {
        await connectPromise
      })

      expect(result.current.isConnecting).toBe(false)
      expect(result.current.connectionError).not.toBeNull()
      expect(result.current.session).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should handle peer-removed-pairing error correctly', async () => {
      const mockDevice = createMockLedgerDevice()
      const peerRemovedError = { _tag: 'PeerRemovedPairingError' }

      mockLedgerDMKService.connectToDevice.mockRejectedValue(peerRemovedError)

      const { result } = renderHook(() => useLedgerConnection())

      let connectionResult: DeviceSessionId | null = null
      await act(async () => {
        connectionResult = await result.current.connectToDevice(mockDevice)
      })

      expect(connectionResult).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.isConnecting).toBe(false)
      expect(result.current.connectionError).toEqual({
        type: 'peer-removed-pairing',
        message: 'Peer removed Pairing information. Open Bluetooth settings and forget the device before reconnecting',
      })
    })

    it('should handle generic connection failure', async () => {
      const mockDevice = createMockLedgerDevice()
      const genericError = new Error('Network connection failed')

      mockLedgerDMKService.connectToDevice.mockRejectedValue(genericError)

      const { result } = renderHook(() => useLedgerConnection())

      let connectionResult: DeviceSessionId | null = null
      await act(async () => {
        connectionResult = await result.current.connectToDevice(mockDevice)
      })

      expect(connectionResult).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.isConnecting).toBe(false)
      expect(result.current.connectionError).toEqual({
        type: 'connection-failed',
        message: 'Failed to connect to device. Please try again.',
      })
    })

    it('should handle unknown error with unknown _tag', async () => {
      const mockDevice = createMockLedgerDevice()
      const unknownError = { _tag: 'SomeUnknownError', message: 'Unknown error occurred' }

      mockLedgerDMKService.connectToDevice.mockRejectedValue(unknownError)

      const { result } = renderHook(() => useLedgerConnection())

      await act(async () => {
        await result.current.connectToDevice(mockDevice)
      })

      expect(result.current.connectionError).toEqual({
        type: 'connection-failed',
        message: 'Failed to connect to device. Please try again.',
      })
    })

    it('should handle error without _tag property', async () => {
      const mockDevice = createMockLedgerDevice()
      const errorWithoutTag = { message: 'Some error without _tag' }

      mockLedgerDMKService.connectToDevice.mockRejectedValue(errorWithoutTag)

      const { result } = renderHook(() => useLedgerConnection())

      await act(async () => {
        await result.current.connectToDevice(mockDevice)
      })

      expect(result.current.connectionError).toEqual({
        type: 'connection-failed',
        message: 'Failed to connect to device. Please try again.',
      })
    })
  })

  describe('error clearing', () => {
    it('should clear connection error when clearError is called', async () => {
      const mockDevice = createMockLedgerDevice()
      mockLedgerDMKService.connectToDevice.mockRejectedValue(new Error('Connection failed'))

      const { result } = renderHook(() => useLedgerConnection())

      // Create error state
      await act(async () => {
        await result.current.connectToDevice(mockDevice)
      })

      expect(result.current.connectionError).not.toBeNull()

      // Clear error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.connectionError).toBeNull()
    })
  })

  describe('session management', () => {
    it('should clear session when clearSession is called', async () => {
      const mockDevice = createMockLedgerDevice()
      const mockSessionId = createMockSessionId()

      mockLedgerDMKService.connectToDevice.mockResolvedValue(mockSessionId)

      const { result } = renderHook(() => useLedgerConnection())

      // Create session
      await act(async () => {
        await result.current.connectToDevice(mockDevice)
      })

      expect(result.current.session).toBe(mockSessionId)

      // Clear session
      act(() => {
        result.current.clearSession()
      })

      expect(result.current.session).toBeNull()
    })

    it('should not affect error state when clearing session', async () => {
      const mockDevice = createMockLedgerDevice()
      mockLedgerDMKService.connectToDevice.mockRejectedValue(new Error('Connection failed'))

      const { result } = renderHook(() => useLedgerConnection())

      // Create error state
      await act(async () => {
        await result.current.connectToDevice(mockDevice)
      })

      const errorBefore = result.current.connectionError

      // Clear session (should not affect error)
      act(() => {
        result.current.clearSession()
      })

      expect(result.current.session).toBeNull()
      expect(result.current.connectionError).toBe(errorBefore)
    })
  })

  describe('function reference stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useLedgerConnection())

      const firstConnectToDevice = result.current.connectToDevice
      const firstClearError = result.current.clearError
      const firstClearSession = result.current.clearSession

      rerender({})

      expect(result.current.connectToDevice).toBe(firstConnectToDevice)
      expect(result.current.clearError).toBe(firstClearError)
      expect(result.current.clearSession).toBe(firstClearSession)
    })
  })

  describe('state isolation', () => {
    it('should maintain independent state between hook instances', async () => {
      const mockDevice1 = createMockLedgerDevice()
      const mockDevice2 = createMockLedgerDevice()
      const mockSessionId1 = createMockSessionId()

      mockLedgerDMKService.connectToDevice
        .mockResolvedValueOnce(mockSessionId1)
        .mockRejectedValueOnce(new Error('Connection failed'))

      const { result: result1 } = renderHook(() => useLedgerConnection())
      const { result: result2 } = renderHook(() => useLedgerConnection())

      // Connect first instance successfully
      await act(async () => {
        await result1.current.connectToDevice(mockDevice1)
      })

      // Fail second instance
      await act(async () => {
        await result2.current.connectToDevice(mockDevice2)
      })

      // Verify states are independent
      expect(result1.current.session).toBe(mockSessionId1)
      expect(result1.current.connectionError).toBeNull()

      expect(result2.current.session).toBeNull()
      expect(result2.current.connectionError).not.toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should handle multiple rapid connection attempts', async () => {
      const mockDevice = createMockLedgerDevice()
      const mockSessionId = createMockSessionId()

      // Set up delayed response
      let resolveConnection: ((sessionId: DeviceSessionId) => void) | undefined
      const connectionPromise = new Promise<DeviceSessionId>((resolve) => {
        resolveConnection = resolve
      })

      mockLedgerDMKService.connectToDevice.mockReturnValue(connectionPromise)

      const { result } = renderHook(() => useLedgerConnection())

      // Start multiple connections rapidly
      const promise1 = result.current.connectToDevice(mockDevice)
      const promise2 = result.current.connectToDevice(mockDevice)

      // Wait for loading state to be set
      await waitFor(() => {
        expect(result.current.isConnecting).toBe(true)
      })

      // Complete the connection
      if (resolveConnection) {
        resolveConnection(mockSessionId)
      }

      await act(async () => {
        await Promise.all([promise1, promise2])
      })

      expect(result.current.isConnecting).toBe(false)
      expect(result.current.session).toBe(mockSessionId)
    })

    it('should handle null/undefined device gracefully', async () => {
      mockLedgerDMKService.connectToDevice.mockRejectedValue(new Error('Invalid device'))

      const { result } = renderHook(() => useLedgerConnection())

      await act(async () => {
        await result.current.connectToDevice(null as unknown as LedgerDevice)
      })

      expect(result.current.connectionError).toEqual({
        type: 'connection-failed',
        message: 'Failed to connect to device. Please try again.',
      })
      expect(result.current.session).toBeNull()
    })
  })
})
