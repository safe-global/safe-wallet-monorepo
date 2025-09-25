import { useState, useCallback } from 'react'
import type { DiscoveredDevice, DeviceSessionId } from '@ledgerhq/device-management-kit'
import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'

interface LedgerDevice {
  id: string
  name: string
  device: DiscoveredDevice
}

interface ConnectionError {
  type: 'peer-removed-pairing' | 'connection-failed' | 'unknown'
  message: string
}

export const useLedgerConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<ConnectionError | null>(null)
  const [session, setSession] = useState<DeviceSessionId | null>(null)

  const connectToDevice = useCallback(async (ledgerDevice: LedgerDevice): Promise<DeviceSessionId | null> => {
    setIsConnecting(true)
    setConnectionError(null)
    setSession(null)

    try {
      const deviceSession = await ledgerDMKService.connectToDevice(ledgerDevice.device)
      setSession(deviceSession)
      return deviceSession
    } catch (error: unknown) {
      // Check the DMK error _tag property
      const dmkError = error as { _tag?: string }

      if (dmkError?._tag === 'PeerRemovedPairingError') {
        setConnectionError({
          type: 'peer-removed-pairing',
          message:
            'Peer removed Pairing information. Open Bluetooth settings and forget the device before reconnecting',
        })
      } else {
        setConnectionError({
          type: 'connection-failed',
          message: 'Failed to connect to device. Please try again.',
        })
      }
      return null
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setConnectionError(null)
  }, [])

  const clearSession = useCallback(() => {
    setSession(null)
  }, [])

  return {
    isConnecting,
    connectionError,
    session,
    connectToDevice,
    clearError,
    clearSession,
  }
}
