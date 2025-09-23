import React, { useRef, useState } from 'react'
import { View } from 'tamagui'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import type { DiscoveredDevice } from '@ledgerhq/device-management-kit'
import { useLedgerDeviceScanning } from '@/src/features/Ledger/hooks/useLedgerDeviceScanning'
import { ScanningProgress } from '@/src/features/Ledger/components/ScanningProgress'
import { DeviceList } from '@/src/features/Ledger/components/DeviceList'

interface LedgerDevice {
  id: string
  name: string
  device: DiscoveredDevice
}

export const LedgerConnectSignContainer = () => {
  const [refresh, setRefresh] = useState(false)
  const params = useLocalSearchParams<{ txId?: string }>()
  const { isScanning, discoveredDevices, startScanning, stopScanning, bluetoothEnabled } = useLedgerDeviceScanning()
  const hasScanStarted = useRef(false)

  useFocusEffect(
    React.useCallback(() => {
      if (bluetoothEnabled === true && !isScanning && !hasScanStarted.current) {
        hasScanStarted.current = true
        startScanning()
      }
    }, [bluetoothEnabled, isScanning, startScanning]),
  )

  const handleDeviceConnect = (ledgerDevice: LedgerDevice) => {
    stopScanning()
    hasScanStarted.current = false
    router.push({
      pathname: '/sign-transaction/ledger-pairing',
      params: {
        deviceData: JSON.stringify(ledgerDevice.device),
        txId: params.txId || '',
      },
    })
  }

  const handleRefresh = () => {
    setRefresh(true)
    if (!isScanning) {
      startScanning()
    }
    setRefresh(false)
  }

  if (discoveredDevices.length === 0) {
    return (
      <View flex={1}>
        <View flex={1} alignItems="center" justifyContent="center" paddingHorizontal="$4">
          <ScanningProgress />
        </View>
      </View>
    )
  }

  return (
    <View flex={1}>
      <DeviceList
        devices={discoveredDevices}
        onDevicePress={handleDeviceConnect}
        onRefresh={handleRefresh}
        isRefreshing={refresh}
      />
    </View>
  )
}
