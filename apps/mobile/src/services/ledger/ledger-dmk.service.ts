import {
  ConsoleLogger,
  DeviceManagementKitBuilder,
  type DeviceManagementKit,
  type DeviceSessionId,
  type DiscoveredDevice,
  DeviceStatus,
} from '@ledgerhq/device-management-kit'
import { RNBleTransportFactory } from '@ledgerhq/device-transport-kit-react-native-ble'
import logger from '@/src/utils/logger'
import type { Subscription } from 'rxjs'

export class LedgerDMKService {
  private static instance: LedgerDMKService
  private dmk: DeviceManagementKit
  private currentSession: DeviceSessionId | null = null
  private sessionStateSubscription: Subscription | null = null
  private scanningSubscription: { unsubscribe: () => void } | null = null
  private connectionLock: Promise<DeviceSessionId> | null = null
  private isDiscovering = false

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
      // Start BLE discovery
      this.dmk.startDiscovering({})
      this.isDiscovering = true

      const subscription = this.dmk.listenToAvailableDevices({}).subscribe({
        next: (availableDevices: DiscoveredDevice[]) => {
          // Filter for Ledger devices and call onDeviceFound for each
          availableDevices.forEach((device: DiscoveredDevice) => {
            onDeviceFound(device)
          })
        },
        error: (error: Error) => {
          logger.error('Ledger device scanning error:', error)
          this.scanningSubscription = null
          this.isDiscovering = false
          onError(error)
        },
      })

      this.scanningSubscription = subscription

      // Return cleanup function
      return () => {
        subscription.unsubscribe()
        this.scanningSubscription = null
        // Actually stop the BLE scan if it's running
        if (this.isDiscovering) {
          this.isDiscovering = false
          this.dmk.stopDiscovering().catch((err) => logger.error('Error stopping discovery:', err))
        }
      }
    } catch (error) {
      this.isDiscovering = false
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
    // Stop the actual BLE discovery if it's running
    if (this.isDiscovering) {
      this.isDiscovering = false
      this.dmk.stopDiscovering().catch((err) => logger.error('Error stopping discovery:', err))
    }
  }

  /**
   * Connect to a specific Ledger device
   * - Reuses existing session if connecting to the same device
   * - Disconnects and reconnects if connecting to a different device
   * - Handles stale sessions gracefully
   * - Prevents race conditions with connection locking
   */
  public async connectToDevice(device: DiscoveredDevice): Promise<DeviceSessionId> {
    // If there's already a connection in progress, wait for it and reuse if same device
    if (this.connectionLock) {
      const existingSession = await this.connectionLock
      try {
        const connectedDevice = this.dmk.getConnectedDevice({ sessionId: existingSession })
        if (connectedDevice.id === device.id) {
          return existingSession
        }
      } catch (error) {
        logger.warn('Existing connection session is stale:', error)
      }
      // Fall through to create new connection for different device
    }

    // Create new connection attempt
    this.connectionLock = this.performConnection(device)

    try {
      return await this.connectionLock
    } finally {
      this.connectionLock = null
    }
  }

  /**
   * Internal method to perform the actual connection logic
   */
  private async performConnection(device: DiscoveredDevice): Promise<DeviceSessionId> {
    try {
      // Stop scanning before connecting to prevent APDU conflicts
      this.stopScanning()

      // Check if we already have an active session
      if (this.currentSession) {
        // First check if the session is actually valid
        const isValid = await this.isSessionValid(this.currentSession)

        if (isValid) {
          try {
            const connectedDevice = this.dmk.getConnectedDevice({ sessionId: this.currentSession })

            if (connectedDevice.id === device.id) {
              return this.currentSession
            }

            // Valid session but different device - properly disconnect
            logger.info('Disconnecting from different device')
            await this.disconnect()
          } catch (error) {
            logger.warn('Failed to get connected device, clearing stale session:', error)
            this.clearSession()
          }
        } else {
          // Session is stale/invalid - just clear it without attempting disconnect
          logger.info('Clearing stale session before reconnecting')
          this.clearSession()
        }
      }

      // Connect to the new device
      const session = await this.dmk.connect({ device })
      this.currentSession = session

      // Start monitoring the session state for disconnections
      this.startMonitoringSession(session)

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
   * Check if a session is still valid by verifying device connection status
   */
  private async isSessionValid(sessionId: DeviceSessionId): Promise<boolean> {
    try {
      const state$ = this.dmk.getDeviceSessionState({ sessionId })

      // Get the current state from the observable
      // Note: We don't manually unsubscribe here. The observable should emit once
      // and complete, and the subscription will be garbage collected after resolution.
      return await new Promise<boolean>((resolve) => {
        state$.subscribe({
          next: (state) => {
            resolve(state.deviceStatus !== DeviceStatus.NOT_CONNECTED)
          },
          error: () => {
            resolve(false)
          },
          complete: () => {
            resolve(false)
          },
        })
      })
    } catch (error) {
      logger.warn('Failed to check session validity:', error)
      return false
    }
  }

  /**
   * Start monitoring session state for disconnections
   */
  private startMonitoringSession(sessionId: DeviceSessionId): void {
    // Clean up any existing subscription
    this.stopMonitoringSession()

    try {
      this.sessionStateSubscription = this.dmk.getDeviceSessionState({ sessionId }).subscribe({
        next: (state) => {
          if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
            logger.info('Device disconnected, clearing session')
            this.clearSession()
          }
        },
        error: (error) => {
          logger.warn('Session state error, clearing session:', error)
          this.clearSession()
        },
        complete: () => {
          logger.info('Session state observable completed, clearing session')
          this.clearSession()
        },
      })
    } catch (error) {
      logger.error('Failed to start monitoring session:', error)
    }
  }

  /**
   * Stop monitoring session state
   */
  private stopMonitoringSession(): void {
    if (this.sessionStateSubscription) {
      this.sessionStateSubscription.unsubscribe()
      this.sessionStateSubscription = null
    }
  }

  /**
   * Clear the current session without attempting to disconnect
   * Use this when the device is already disconnected or session is stale
   */
  private clearSession(): void {
    this.stopMonitoringSession()
    this.currentSession = null
  }

  /**
   * Disconnect from the current device
   */
  public async disconnect(): Promise<void> {
    if (this.currentSession) {
      const sessionToDisconnect = this.currentSession

      // Clear session and stop monitoring first
      this.clearSession()

      try {
        await this.dmk.disconnect({ sessionId: sessionToDisconnect })
      } catch (error) {
        logger.error('Error disconnecting:', error)
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
    // Clear any pending connection lock
    this.connectionLock = null

    // Stop monitoring
    this.stopMonitoringSession()

    if (this.currentSession) {
      this.disconnect().catch((error) => logger.error('Error during cleanup disconnect:', error))
    }
  }
}

export const ledgerDMKService = LedgerDMKService.getInstance()
