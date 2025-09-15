import { BleManager } from 'react-native-ble-plx'

export class BluetoothService {
  private static instance: BluetoothService
  private bleManager: BleManager

  private constructor() {
    this.bleManager = new BleManager()
  }

  public static getInstance(): BluetoothService {
    if (!BluetoothService.instance) {
      BluetoothService.instance = new BluetoothService()
    }
    return BluetoothService.instance
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
    this.bleManager.destroy()
  }
}

export const bluetoothService = BluetoothService.getInstance()
