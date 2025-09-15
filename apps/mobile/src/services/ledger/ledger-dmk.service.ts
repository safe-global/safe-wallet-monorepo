import {
  ConsoleLogger,
  DeviceManagementKitBuilder,
  type DeviceManagementKit,
  type DeviceSessionId,
  type DiscoveredDevice,
} from '@ledgerhq/device-management-kit'
import { RNBleTransportFactory } from '@ledgerhq/device-transport-kit-react-native-ble'

export class LedgerDMKService {
  private static instance: LedgerDMKService
  private dmk: DeviceManagementKit
  private currentSession: DeviceSessionId | null = null
  private scanningSubscription: { unsubscribe: () => void } | null = null

  private constructor() {
    this.dmk = new DeviceManagementKitBuilder()
      .addLogger(new ConsoleLogger())
      .addTransport(RNBleTransportFactory)
      .build()
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
    // Stop any existing scanning first
    this.stopScanning()

    try {
      const subscription = this.dmk.listenToAvailableDevices({}).subscribe({
        next: (availableDevices: DiscoveredDevice[]) => {
          // Filter for Ledger devices and call onDeviceFound for each
          availableDevices.forEach((device: DiscoveredDevice) => {
            onDeviceFound(device)
          })
        },
        error: (error: Error) => {
          console.log('error', error)
          this.scanningSubscription = null
          onError(error)
        },
      })

      this.scanningSubscription = subscription

      // Return cleanup function
      return () => {
        subscription.unsubscribe()
        this.scanningSubscription = null
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
    if (this.scanningSubscription) {
      this.scanningSubscription.unsubscribe()
      this.scanningSubscription = null
    }
  }

  /**
   * Connect to a specific Ledger device
   */
  public async connectToDevice(device: DiscoveredDevice): Promise<DeviceSessionId> {
    try {
      // Stop scanning before connecting to prevent APDU conflicts
      this.stopScanning()

      const session = await this.dmk.connect({ device })
      this.currentSession = session
      return session
    } catch (error) {
      // Only expose safe error information to prevent leaking sensitive data
      const dmkError = error as { _tag?: string; message?: string }
      const safeError = {
        _tag: dmkError._tag || 'UnknownConnectionError',
        message: dmkError.message || 'Failed to connect to device',
      }

      throw safeError
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
   * Clean up resources
   */
  public dispose(): void {
    if (this.currentSession) {
      this.disconnect().catch(console.error)
    }
  }
}

export const ledgerDMKService = LedgerDMKService.getInstance()
