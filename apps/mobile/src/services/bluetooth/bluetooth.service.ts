import { Linking, Platform } from 'react-native'
import { check, request, PERMISSIONS, RESULTS, PermissionStatus } from 'react-native-permissions'
import logger from '@/src/utils/logger'

export interface BluetoothPermissionResult {
  granted: boolean
  error?: string
}

export class BluetoothService {
  private static instance: BluetoothService

  public static getInstance(): BluetoothService {
    if (!BluetoothService.instance) {
      BluetoothService.instance = new BluetoothService()
    }
    return BluetoothService.instance
  }

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the appropriate Bluetooth permission for the current platform
   */
  private getBluetoothPermission() {
    if (Platform.OS === 'ios') {
      return PERMISSIONS.IOS.BLUETOOTH
    } else {
      // For Android API 31+, we need BLUETOOTH_SCAN and BLUETOOTH_CONNECT
      // For older versions, we need ACCESS_FINE_LOCATION
      return PERMISSIONS.ANDROID.BLUETOOTH_SCAN
    }
  }

  /**
   * Check current Bluetooth permission status
   */
  public async checkBluetoothPermission(): Promise<PermissionStatus> {
    try {
      const permission = this.getBluetoothPermission()
      const status = await check(permission)
      logger.info('Bluetooth permission status:', status)
      return status
    } catch (error) {
      logger.error('Error checking Bluetooth permission:', error)
      return RESULTS.UNAVAILABLE
    }
  }

  /**
   * Request Bluetooth permissions using react-native-permissions
   */
  public async requestBluetoothPermissions(): Promise<BluetoothPermissionResult> {
    try {
      const permission = this.getBluetoothPermission()
      logger.info('Requesting Bluetooth permission:', permission)

      const status = await request(permission)
      logger.info('Bluetooth permission result:', status)

      switch (status) {
        case RESULTS.GRANTED:
          return {
            granted: true,
          }

        case RESULTS.DENIED:
          return {
            granted: false,
            error: 'Bluetooth permission was denied. Please try again.',
          }

        case RESULTS.BLOCKED:
          return {
            granted: false,
            error: 'Bluetooth permission is blocked. Please enable it in your device settings.',
          }

        case RESULTS.LIMITED:
          return {
            granted: true, // Limited access is still access
          }

        case RESULTS.UNAVAILABLE:
        default:
          return {
            granted: false,
            error: 'Bluetooth permission is not available on this device.',
          }
      }
    } catch (error) {
      logger.error('Error requesting Bluetooth permissions:', error)
      return {
        granted: false,
        error: error instanceof Error ? error.message : 'Failed to request Bluetooth permissions',
      }
    }
  }

  /**
   * Open device settings for manual permission configuration
   */
  public async openDeviceSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:')
      } else {
        await Linking.openSettings()
      }
    } catch (error) {
      logger.error('Failed to open device settings:', error)
    }
  }
}

// Export singleton instance
export const bluetoothService = BluetoothService.getInstance()
