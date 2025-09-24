import { useState, useCallback } from 'react'
import { bluetoothService, type BluetoothPermissionResult } from '@/src/services/bluetooth/bluetooth.service'
import { RESULTS, PermissionStatus } from 'react-native-permissions'
import logger from '@/src/utils/logger'

export interface BluetoothStatus {
  permissionGranted: boolean | null
  permissionStatus: PermissionStatus | null
  error: string | null
}

export const useBluetoothStatus = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkBluetoothPermission = useCallback(async () => {
    try {
      const status = await bluetoothService.checkBluetoothPermission()
      const granted = status === RESULTS.GRANTED || status === RESULTS.LIMITED

      setPermissionGranted(granted)
      setPermissionStatus(status)
      setError(null)

      return granted
    } catch (error) {
      logger.error('Error checking Bluetooth permission:', error)
      setPermissionGranted(false)
      setPermissionStatus(null)
      setError(error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }, [])

  const requestBluetoothPermissions = useCallback(async (): Promise<BluetoothPermissionResult> => {
    try {
      const result = await bluetoothService.requestBluetoothPermissions()

      // Update state based on result
      setPermissionGranted(result.granted)
      setError(result.error || null)

      // After requesting, check the current status to get the exact permission state
      const currentStatus = await bluetoothService.checkBluetoothPermission()
      setPermissionStatus(currentStatus)

      return result
    } catch (error) {
      logger.error('Error requesting Bluetooth permissions:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      setPermissionGranted(false)
      setPermissionStatus(null)

      return {
        granted: false,
        error: errorMessage,
      }
    }
  }, [])

  const openDeviceSettings = useCallback(async (): Promise<void> => {
    await bluetoothService.openDeviceSettings()
  }, [])

  return {
    permissionGranted,
    permissionStatus,
    error,
    checkBluetoothPermission,
    requestBluetoothPermissions,
    openDeviceSettings,
  }
}
