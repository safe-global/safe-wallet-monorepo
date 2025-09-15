import React, { useRef } from 'react'
import { View } from 'tamagui'
import { router, useFocusEffect } from 'expo-router'
import type { DiscoveredDevice } from '@ledgerhq/device-management-kit'
import { useLedgerDeviceScanning } from '@/src/features/Ledger/hooks/useLedgerDeviceScanning'
import { ScanningProgress } from '@/src/features/Ledger/components/ScanningProgress'
import { DeviceList } from '@/src/features/Ledger/components/DeviceList'

interface LedgerDevice {
  id: string
  name: string
  device: DiscoveredDevice
}

export const LedgerConnectContainer = () => {
  const { isScanning, discoveredDevices, startScanning, stopScanning, bluetoothEnabled } = useLedgerDeviceScanning()
  const hasScanStarted = useRef(false)

  // Auto-start scanning when screen comes into focus (only once)
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
      pathname: '/import-signers/ledger-pairing',
      params: {
        deviceData: JSON.stringify(ledgerDevice.device),
      },
    })
  }

  const handleRefresh = () => {
    if (!isScanning) {
      startScanning()
    }
  }

  // Show scanning screen when no devices found
  if (discoveredDevices.length === 0) {
    return (
      <View flex={1}>
        <View flex={1} alignItems="center" justifyContent="center" paddingHorizontal="$4">
          <ScanningProgress />
        </View>
      </View>
    )
  }

  // Show device list when devices are found
  return (
    <View flex={1}>
      <DeviceList
        devices={discoveredDevices}
        onDevicePress={handleDeviceConnect}
        onRefresh={handleRefresh}
        isRefreshing={isScanning}
      />
    </View>
  )
}
