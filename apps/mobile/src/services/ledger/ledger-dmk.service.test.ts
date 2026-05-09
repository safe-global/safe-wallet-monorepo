import type { DiscoveredDevice } from '@ledgerhq/device-management-kit'

const mockStartDiscovering = jest.fn()
const mockStopDiscovering = jest.fn().mockResolvedValue(undefined)
const mockListenToAvailableDevices = jest.fn()
const mockConnect = jest.fn()
const mockDisconnect = jest.fn()
const mockGetConnectedDevice = jest.fn()
const mockGetDeviceSessionState = jest.fn()
const mockLoggerError = jest.fn()
const mockLoggerWarn = jest.fn()
const mockLoggerInfo = jest.fn()

jest.mock('@ledgerhq/device-management-kit', () => {
  return {
    DeviceManagementKitBuilder: jest.fn().mockImplementation(() => ({
      addLogger: jest.fn().mockReturnThis(),
      addTransport: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({
        startDiscovering: (...args: unknown[]) => mockStartDiscovering(...args),
        stopDiscovering: (...args: unknown[]) => mockStopDiscovering(...args),
        listenToAvailableDevices: (...args: unknown[]) => mockListenToAvailableDevices(...args),
        connect: (...args: unknown[]) => mockConnect(...args),
        disconnect: (...args: unknown[]) => mockDisconnect(...args),
        getConnectedDevice: (...args: unknown[]) => mockGetConnectedDevice(...args),
        getDeviceSessionState: (...args: unknown[]) => mockGetDeviceSessionState(...args),
      }),
    })),
    ConsoleLogger: jest.fn(),
    DeviceStatus: {
      NOT_CONNECTED: 'not-connected',
      CONNECTED: 'connected',
    },
  }
})

jest.mock('@ledgerhq/device-transport-kit-react-native-ble', () => ({
  RNBleTransportFactory: {},
}))

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: {
    error: (...args: unknown[]) => mockLoggerError(...args),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
    info: (...args: unknown[]) => mockLoggerInfo(...args),
  },
}))

import { ledgerDMKService, LedgerDMKService } from './ledger-dmk.service'

describe('LedgerDMKService', () => {
  const mockDevice = {
    id: 'device-123',
    name: 'Nano X',
    type: 'BLE',
    deviceModel: { id: 'nanoX', productName: 'Nano X' },
    transport: 'BLE',
  } as unknown as DiscoveredDevice

  const mockSessionId = 'session-456'

  beforeEach(() => {
    jest.clearAllMocks()
    mockStopDiscovering.mockResolvedValue(undefined)
    mockConnect.mockResolvedValue(mockSessionId)
    mockDisconnect.mockResolvedValue(undefined)
    mockListenToAvailableDevices.mockReturnValue({
      subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    })
    mockGetDeviceSessionState.mockReturnValue({
      subscribe: jest.fn(({ next }) => {
        next({ deviceStatus: 'connected' })
        return { unsubscribe: jest.fn() }
      }),
    })
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = LedgerDMKService.getInstance()
      const instance2 = LedgerDMKService.getInstance()

      expect(instance1).toBe(instance2)
    })

    it('should return same instance as exported singleton', () => {
      expect(ledgerDMKService).toBe(LedgerDMKService.getInstance())
    })
  })

  describe('startScanning', () => {
    it('should start BLE discovery and subscribe to available devices', () => {
      const onDeviceFound = jest.fn()
      const onError = jest.fn()

      ledgerDMKService.startScanning(onDeviceFound, onError)

      expect(mockStartDiscovering).toHaveBeenCalledWith({})
      expect(mockListenToAvailableDevices).toHaveBeenCalledWith({})
    })

    it('should call onDeviceFound when devices are discovered', () => {
      const mockSubscribe = jest.fn(({ next }) => {
        next([mockDevice])
        return { unsubscribe: jest.fn() }
      })
      mockListenToAvailableDevices.mockReturnValue({ subscribe: mockSubscribe })

      const onDeviceFound = jest.fn()
      const onError = jest.fn()

      ledgerDMKService.startScanning(onDeviceFound, onError)

      expect(onDeviceFound).toHaveBeenCalledWith(mockDevice)
    })

    it('should call onError when scanning fails', () => {
      const mockError = new Error('BLE error')
      const mockSubscribe = jest.fn(({ error }) => {
        error(mockError)
        return { unsubscribe: jest.fn() }
      })
      mockListenToAvailableDevices.mockReturnValue({ subscribe: mockSubscribe })

      const onDeviceFound = jest.fn()
      const onError = jest.fn()

      ledgerDMKService.startScanning(onDeviceFound, onError)

      expect(onError).toHaveBeenCalledWith(mockError)
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should return cleanup function', () => {
      const mockUnsubscribe = jest.fn()
      mockListenToAvailableDevices.mockReturnValue({
        subscribe: jest.fn().mockReturnValue({ unsubscribe: mockUnsubscribe }),
      })

      const cleanup = ledgerDMKService.startScanning(jest.fn(), jest.fn())

      expect(typeof cleanup).toBe('function')

      cleanup()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('stopScanning', () => {
    it('should stop BLE discovery', () => {
      const mockUnsubscribe = jest.fn()
      mockListenToAvailableDevices.mockReturnValue({
        subscribe: jest.fn().mockReturnValue({ unsubscribe: mockUnsubscribe }),
      })

      ledgerDMKService.startScanning(jest.fn(), jest.fn())
      ledgerDMKService.stopScanning()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('connectToDevice', () => {
    it('should connect to device and return session', async () => {
      mockGetConnectedDevice.mockImplementation(() => {
        throw new Error('Not connected')
      })

      const session = await ledgerDMKService.connectToDevice(mockDevice)

      expect(mockConnect).toHaveBeenCalledWith({ device: mockDevice })
      expect(session).toBe(mockSessionId)
    })

    it('should reuse existing session for same device', async () => {
      mockGetConnectedDevice.mockReturnValue({ id: mockDevice.id })

      await ledgerDMKService.connectToDevice(mockDevice)
      mockConnect.mockClear()

      await ledgerDMKService.connectToDevice(mockDevice)
    })

    it('should throw error when connection fails', async () => {
      const connectionError = { _tag: 'ConnectionError', message: 'Device busy' }
      mockConnect.mockRejectedValue(connectionError)
      mockGetConnectedDevice.mockImplementation(() => {
        throw new Error('Not connected')
      })
      mockGetDeviceSessionState.mockReturnValue({
        subscribe: jest.fn(({ next }) => {
          next({ deviceStatus: 'not-connected' })
          return { unsubscribe: jest.fn() }
        }),
      })

      await expect(ledgerDMKService.connectToDevice(mockDevice)).rejects.toEqual({
        _tag: 'ConnectionError',
        message: 'Device busy',
      })
    })
  })

  describe('disconnect', () => {
    it('should disconnect from current session', async () => {
      mockGetConnectedDevice.mockImplementation(() => {
        throw new Error('Not connected')
      })

      await ledgerDMKService.connectToDevice(mockDevice)
      await ledgerDMKService.disconnect()

      expect(mockDisconnect).toHaveBeenCalledWith({ sessionId: mockSessionId })
    })

    it('should throw error when disconnect fails', async () => {
      const disconnectError = new Error('Disconnect failed')
      mockDisconnect.mockRejectedValue(disconnectError)
      mockGetConnectedDevice.mockImplementation(() => {
        throw new Error('Not connected')
      })

      await ledgerDMKService.connectToDevice(mockDevice)

      await expect(ledgerDMKService.disconnect()).rejects.toThrow('Disconnect failed')
    })
  })

  describe('getCurrentSession', () => {
    it('should return session ID after successfully connecting to a new device', async () => {
      mockGetConnectedDevice.mockImplementation(() => {
        throw new Error('Not connected')
      })

      await ledgerDMKService.connectToDevice(mockDevice)

      expect(ledgerDMKService.getCurrentSession()).toBe(mockSessionId)
    })
  })

  describe('dispose', () => {
    it('should clean up resources', async () => {
      mockGetConnectedDevice.mockImplementation(() => {
        throw new Error('Not connected')
      })

      await ledgerDMKService.connectToDevice(mockDevice)

      ledgerDMKService.dispose()

      expect(mockDisconnect).toHaveBeenCalled()
    })
  })
})
