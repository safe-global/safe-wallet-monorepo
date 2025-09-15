import { useState, useEffect, useCallback } from 'react'
import { bluetoothService } from '@/src/services/bluetooth/bluetooth.service'

export const useBluetoothStatus = () => {
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean | null>(null)

  const checkBluetoothStatus = useCallback(async () => {
    try {
      const isEnabled = await bluetoothService.isBluetoothEnabled()
      setBluetoothEnabled(isEnabled)
      return isEnabled
    } catch (error) {
      console.error('Error checking Bluetooth status:', error)
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
