import { useState, useEffect, useCallback } from 'react'
import { bluetoothService } from '@/src/services/bluetooth/bluetooth.service'
import logger from '@/src/utils/logger'

export const useBluetoothStatus = () => {
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean | null>(null)

  const checkBluetoothStatus = useCallback(async () => {
    try {
      const isEnabled = await bluetoothService.isBluetoothEnabled()
      setBluetoothEnabled(isEnabled)
      return isEnabled
    } catch (error) {
      logger.error('Error checking Bluetooth status:', error)
      setBluetoothEnabled(false)
      return false
    }
  }, [])

  useEffect(() => {
    checkBluetoothStatus()
  }, [])

  return {
    bluetoothEnabled,
    checkBluetoothStatus,
  }
}
