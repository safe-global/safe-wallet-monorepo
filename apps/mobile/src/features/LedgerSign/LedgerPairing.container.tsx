import React, { useRef } from 'react'
import { View } from 'tamagui'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import type { DiscoveredDevice } from '@ledgerhq/device-management-kit'
import { useLedgerConnection } from '@/src/features/Ledger/hooks/useLedgerConnection'
import { PairingProgress } from '@/src/features/Ledger/components/PairingProgress'
import { PairingError } from '@/src/features/Ledger/components/PairingError'

export const LedgerPairingSignContainer = () => {
  const params = useLocalSearchParams<{
    deviceData: string
    txId?: string
  }>()

  const { connectToDevice, connectionError, clearError, isConnecting } = useLedgerConnection()
  const hasPairingStarted = useRef(false)

  const device: DiscoveredDevice | null = params.deviceData ? JSON.parse(params.deviceData) : null

  const handleDeviceConnection = React.useCallback(async () => {
    if (!device) {
      return
    }

    const ledgerDevice = {
      id: device.id,
      name: device.name,
      device,
    }

    const session = await connectToDevice(ledgerDevice)
    if (session) {
      router.replace({
        pathname: '/sign-transaction/ledger-review',
        params: {
          deviceName: device.name,
          sessionId: session,
          txId: params.txId || '',
        },
      })
    }
  }, [device, connectToDevice, params.txId])

  useFocusEffect(
    React.useCallback(() => {
      if (device && !hasPairingStarted.current) {
        hasPairingStarted.current = true
        handleDeviceConnection()
      }
    }, [device, handleDeviceConnection]),
  )

  const handleRetryPairing = async () => {
    clearError()
    await handleDeviceConnection()
  }

  if (connectionError && !isConnecting) {
    return (
      <View flex={1}>
        <View flex={1} alignItems="center" justifyContent="center" paddingHorizontal="$4">
          <PairingError
            deviceName={device?.name || 'Unknown Device'}
            errorMessage={connectionError.message}
            onRetry={handleRetryPairing}
          />
        </View>
      </View>
    )
  }

  return (
    <View flex={1}>
      <View flex={1} alignItems="center" justifyContent="center" paddingHorizontal="$4">
        <PairingProgress deviceName={device?.name || 'Unknown Device'} />
      </View>
    </View>
  )
}
