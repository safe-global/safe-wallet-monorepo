import {
  ConsoleLogger,
  DeviceManagementKitBuilder,
  type DeviceManagementKit,
  type DeviceSessionId,
  type DiscoveredDevice,
} from '@ledgerhq/device-management-kit'
// import { webBleTransportFactory } from '@ledgerhq/device-transport-kit-web-ble'
import { RNBleTransportFactory } from '@ledgerhq/device-transport-kit-react-native-ble'
import { BleManager } from 'react-native-ble-plx'

export class LedgerDMKService {
  private static instance: LedgerDMKService
  private dmk: DeviceManagementKit
  private bleManager: BleManager
  private currentSession: DeviceSessionId | null = null

  private constructor() {
    // Initialize the Device Management Kit with console logger and WebBLE transport
    this.dmk = new DeviceManagementKitBuilder()
      .addLogger(new ConsoleLogger())
      .addTransport(RNBleTransportFactory)
      .build()

    // Initialize BLE manager
    this.bleManager = new BleManager()
  }

  public static getInstance(): LedgerDMKService {
    if (!LedgerDMKService.instance) {
      LedgerDMKService.instance = new LedgerDMKService()
    }
    return LedgerDMKService.instance
  }

  /**
   * Start scanning for Ledger devices
   */
  public startScanning(onDeviceFound: (device: DiscoveredDevice) => void, onError: (error: Error) => void): () => void {
    try {
      const subscription = this.dmk.listenToAvailableDevices({}).subscribe({
        next: (availableDevices: DiscoveredDevice[]) => {
          console.log('availableDevices', availableDevices)
          // Filter for Ledger devices and call onDeviceFound for each
          availableDevices.forEach((device: DiscoveredDevice) => {
            onDeviceFound(device)
          })
        },
        error: (error: Error) => {
          console.log('error', error)
          onError(error)
        },
      })

      // Return cleanup function
      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Failed to start scanning'))
      return () => {
        // Cleanup function for error case
      }
    }
  }

  /**
   * Stop scanning for devices
   */
  public stopScanning(): void {
    // The subscription cleanup is handled by the return function from startScanning
  }

  /**
   * Connect to a specific Ledger device
   */
  public async connectToDevice(device: DiscoveredDevice): Promise<DeviceSessionId> {
    try {
      console.log('device', device)
      const session = await this.dmk.connect({ device })
      this.currentSession = session
      return session
    } catch (error) {
      throw new Error(`Failed to connect to device: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Disconnect from the current device
   */
  public async disconnect(): Promise<void> {
    if (this.currentSession) {
      try {
        await this.dmk.disconnect({ sessionId: this.currentSession })
        this.currentSession = null
      } catch (error) {
        console.error('Error disconnecting:', error)
        throw error
      }
    }
  }

  /**
   * Get the current session
   */
  public getCurrentSession(): DeviceSessionId | null {
    return this.currentSession
  }

  /**
   * Check if Bluetooth is enabled
   */
  public async isBluetoothEnabled(): Promise<boolean> {
    try {
      const state = await this.bleManager.state()
      return state === 'PoweredOn'
    } catch (error) {
      console.error('Error checking Bluetooth state:', error)
      return false
    }
  }

  /**
   * Request Bluetooth permissions
   */
  public async requestBluetoothPermissions(): Promise<boolean> {
    try {
      const state = await this.bleManager.state()
      if (state === 'PoweredOff') {
        return false
      }
      return true
    } catch (error) {
      console.error('Error requesting Bluetooth permissions:', error)
      return false
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.currentSession) {
      this.disconnect().catch(console.error)
    }
    this.bleManager.destroy()
  }
}

export const ledgerDMKService = LedgerDMKService.getInstance()
