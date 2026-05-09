import { useState, useCallback, useEffect, useRef } from 'react'
import type { DiscoveredDevice } from '@ledgerhq/device-management-kit'
import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'
import logger from '@/src/utils/logger'

interface LedgerDevice {
  id: string
  name: string
  device: DiscoveredDevice
}

const CONTINUE_SCAN_AFTER_FIRST_DEVICE_MS = 10000

export const useLedgerDeviceScanning = () => {
  const [isScanning, setIsScanning] = useState(false)
  const [discoveredDevices, setDiscoveredDevices] = useState<LedgerDevice[]>([])
  const scanCleanupRef = useRef<(() => void) | null>(null)
  const [firstDeviceFoundAt, setFirstDeviceFoundAt] = useState<number | null>(null)

  const addDevice = useCallback((device: DiscoveredDevice) => {
    setDiscoveredDevices((prev) => {
      const exists = prev.some((d) => d.id === device.id)
      if (!exists) {
        // Mark when first device is found
        if (prev.length === 0) {
          setFirstDeviceFoundAt(Date.now())
        }

        return [
          ...prev,
          {
            id: device.id,
            name: device.name || 'Ledger Device',
            device,
          },
        ]
      }
      return prev
    })
  }, [])

  const handleScanError = useCallback((error: Error) => {
    logger.error('Scanning error:', error)
    setIsScanning(false)
  }, [])

  const startScanning = useCallback(() => {
    logger.info('Starting Ledger device scanning')

    setIsScanning(true)
    setDiscoveredDevices([])
    setFirstDeviceFoundAt(null)

    const cleanup = ledgerDMKService.startScanning(addDevice, handleScanError)
    scanCleanupRef.current = cleanup

    // No timeout - scan indefinitely until first device is found
  }, [addDevice, handleScanError])

  const stopScanning = useCallback(() => {
    if (scanCleanupRef.current) {
      scanCleanupRef.current()
      scanCleanupRef.current = null
    }
    setIsScanning(false)
  }, [])

  // Auto-stop scanning 10 seconds after finding first device
  useEffect(() => {
    if (firstDeviceFoundAt && isScanning) {
      const timeoutId = setTimeout(() => {
        if (isScanning) {
          stopScanning()
        }
      }, CONTINUE_SCAN_AFTER_FIRST_DEVICE_MS)

      return () => clearTimeout(timeoutId)
    }
  }, [firstDeviceFoundAt, isScanning, stopScanning])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanCleanupRef.current) {
        scanCleanupRef.current()
      }
    }
  }, [])

  return {
    isScanning,
    discoveredDevices,
    startScanning,
    stopScanning,
  }
}
