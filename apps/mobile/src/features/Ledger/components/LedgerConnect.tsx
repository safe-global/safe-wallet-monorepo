import React, { useRef, useState } from 'react'
import { View } from 'tamagui'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import type { DiscoveredDevice } from '@ledgerhq/device-management-kit'
import { useLedgerDeviceScanning } from '@/src/features/Ledger/hooks/useLedgerDeviceScanning'
import { useBluetoothStatus } from '@/src/features/Ledger/hooks/useBluetoothStatus'
import { ScanningProgress } from '@/src/features/Ledger/components/ScanningProgress'
import { DeviceList } from '@/src/features/Ledger/components/DeviceList'
import { BluetoothError } from '@/src/features/Ledger/components/BluetoothError'

interface LedgerDevice {
  id: string
  name: string
  device: DiscoveredDevice
}

interface NavigationConfig {
  pathname: string
  getParams: (device: DiscoveredDevice, searchParams?: Record<string, string>) => Record<string, string>
}

interface LedgerConnectProps {
  navigationConfig: NavigationConfig
}

export const LedgerConnect: React.FC<LedgerConnectProps> = ({ navigationConfig }) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const searchParams = useLocalSearchParams()

  // Bluetooth permission management
  const {
    error: bluetoothError,
    permissionStatus,
    requestBluetoothPermissions,
    openDeviceSettings,
  } = useBluetoothStatus()

  // Device scanning
  const { isScanning, discoveredDevices, startScanning, stopScanning } = useLedgerDeviceScanning()

  const hasScanStarted = useRef(false)
  const [permissionResult, setPermissionResult] = useState<{
    granted: boolean
    error?: string
  } | null>(null)

  useFocusEffect(
    React.useCallback(() => {
      if (!hasScanStarted.current) {
        hasScanStarted.current = true
        handleBluetoothPermissionFlow()
      }
    }, []),
  )

  const handleBluetoothPermissionFlow = async () => {
    try {
      const result = await requestBluetoothPermissions()
      setPermissionResult(result)

      // If permission granted, automatically start scanning
      if (result.granted) {
        startScanning()
      }
      // For all other cases (denied, etc.), show appropriate error UI
    } catch (_error) {
      setPermissionResult({
        granted: false,
        error: 'Failed to request Bluetooth permissions',
      })
    }
  }

  const handleDeviceConnect = (ledgerDevice: LedgerDevice) => {
    stopScanning()
    hasScanStarted.current = false
    router.push({
      pathname: navigationConfig.pathname,
      params: navigationConfig.getParams(ledgerDevice.device, searchParams as Record<string, string>),
    } as never)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    if (!isScanning) {
      startScanning()
    }
    setIsRefreshing(false)
  }

  const handleRetryPermissions = async () => {
    await handleBluetoothPermissionFlow()
  }

  // Determine if we should show an error vs scanning
  const shouldShowError = () => {
    // If actively scanning, never show error
    if (isScanning) {
      return false
    }

    // If we have a permission result, use it to determine error state
    if (permissionResult) {
      return !permissionResult.granted
    }

    // If no permission result yet, don't show error (still requesting)
    return false
  }

  const hasBluetoothError = shouldShowError()

  if (hasBluetoothError) {
    const errorMessage = bluetoothError || permissionResult?.error || 'Bluetooth permission required'

    return (
      <View flex={1}>
        <View flex={1} alignItems="center" justifyContent="center" paddingHorizontal="$4">
          <BluetoothError
            permissionStatus={permissionStatus}
            errorMessage={errorMessage}
            onRetry={handleRetryPermissions}
            onOpenSettings={openDeviceSettings}
          />
        </View>
      </View>
    )
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
        isRefreshing={isRefreshing}
      />
    </View>
  )
}
