import React, { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { View, Button, Text, Spinner, H5 } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import type { DiscoveredDevice } from '@ledgerhq/device-management-kit'

import { SectionTitle } from '@/src/components/Title'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import { Container } from '@/src/components/Container'
import { Badge } from '@/src/components/Badge'
import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'

interface LedgerDevice {
  id: string
  name: string
  device: DiscoveredDevice
}

const title = 'Connect Ledger'

export default function LedgerConnectPage() {
  const { bottom } = useSafeAreaInsets()
  const [isScanning, setIsScanning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [discoveredDevices, setDiscoveredDevices] = useState<LedgerDevice[]>([])
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean | null>(null)
  const [scanCleanup, setScanCleanup] = useState<(() => void) | null>(null)

  console.log('discoveredDevices', discoveredDevices)
  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>{title}</NavBarTitle>,
  })

  // Check Bluetooth status on mount
  useEffect(() => {
    checkBluetoothStatus()
  }, [])

  // Cleanup scanning on unmount
  useEffect(() => {
    return () => {
      if (scanCleanup) {
        scanCleanup()
      }
    }
  }, [scanCleanup])

  const checkBluetoothStatus = async () => {
    try {
      const isEnabled = await ledgerDMKService.isBluetoothEnabled()
      setBluetoothEnabled(isEnabled)

      if (!isEnabled) {
        Alert.alert('Bluetooth Required', 'Please enable Bluetooth to connect to your Ledger device.', [
          {
            text: 'Check Again',
            onPress: checkBluetoothStatus,
          },
        ])
      }
    } catch (error) {
      console.error('Error checking Bluetooth status:', error)
      setBluetoothEnabled(false)
    }
  }

  const startScanning = useCallback(async () => {
    if (!bluetoothEnabled) {
      await checkBluetoothStatus()
      return
    }

    setIsScanning(true)
    setDiscoveredDevices([])

    const cleanup = ledgerDMKService.startScanning(
      (device: DiscoveredDevice) => {
        // Add discovered device to the list
        setDiscoveredDevices((prev) => {
          // Check if device already exists to avoid duplicates
          const exists = prev.some((d) => d.id === device.id)
          if (!exists) {
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
      },
      (error: Error) => {
        console.error('Scanning error:', error)
        setIsScanning(false)
        Alert.alert('Scanning Error', 'Failed to scan for Ledger devices. Please try again.', [
          {
            text: 'Retry',
            onPress: startScanning,
          },
        ])
      },
    )

    setScanCleanup(() => cleanup)

    // Auto-stop scanning after 30 seconds
    setTimeout(() => {
      setIsScanning(false)
      cleanup()
      setScanCleanup(null)
    }, 30000)
  }, [bluetoothEnabled])

  const stopScanning = useCallback(() => {
    if (scanCleanup) {
      scanCleanup()
      setScanCleanup(null)
    }
    setIsScanning(false)
  }, [scanCleanup])

  const connectToDevice = async (ledgerDevice: LedgerDevice) => {
    setIsConnecting(true)

    try {
      // Stop scanning first
      if (scanCleanup) {
        scanCleanup()
        setScanCleanup(null)
        setIsScanning(false)
      }

      const session = await ledgerDMKService.connectToDevice(ledgerDevice.device)

      console.log('session', session)
      // Navigate to address selection screen
      router.push({
        pathname: '/import-signers/ledger-addresses',
        params: {
          deviceName: ledgerDevice.name,
          sessionId: session,
        },
      })
    } catch (error) {
      console.error('Connection error:', error)
      Alert.alert(
        'Connection Failed',
        `Failed to connect to ${ledgerDevice.name}. Make sure your device is unlocked and the Ethereum app is open.`,
        [
          {
            text: 'Retry',
            onPress: () => connectToDevice(ledgerDevice),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
      )
    } finally {
      setIsConnecting(false)
    }
  }

  const renderDeviceItem = (ledgerDevice: LedgerDevice) => (
    <Container
      key={ledgerDevice.id}
      marginHorizontal="$3"
      marginTop="$3"
      onPress={() => connectToDevice(ledgerDevice)}
      testID={`ledger-device-${ledgerDevice.id}`}
    >
      <View flexDirection="row" alignItems="center" gap="$3">
        <Badge circular content={<SafeFontIcon name="hardware" size={16} />} themeName="badge_background" />
        <View flex={1}>
          <H5 fontWeight={600}>{ledgerDevice.name}</H5>
          <Text fontSize="$3" color="$colorSecondary">
            Tap to connect
          </Text>
        </View>
        {isConnecting && <Spinner size="small" color="$primary" />}
      </View>
    </Container>
  )

  return (
    <View style={{ flex: 1 }} paddingBottom={bottom}>
      <ScrollView onScroll={handleScroll}>
        <SectionTitle
          title={title}
          description="Make sure your Ledger device is unlocked and the Ethereum app is open."
        />

        {bluetoothEnabled === false && (
          <Container marginHorizontal="$3" marginTop="$3" backgroundColor="$backgroundWarning">
            <View flexDirection="row" alignItems="center" gap="$3">
              <SafeFontIcon name="alert" size={16} color="$warning" />
              <View flex={1}>
                <Text fontSize="$4" color="$warning">
                  Bluetooth is required to connect to your Ledger device.
                </Text>
              </View>
            </View>
          </Container>
        )}

        {/* Scan Button */}
        <View paddingHorizontal="$3" marginTop="$6">
          {!isScanning ? (
            <SafeButton onPress={startScanning} disabled={bluetoothEnabled === false} testID="start-scan-button">
              <SafeFontIcon name="scan" size={16} />
              Scan for Devices
            </SafeButton>
          ) : (
            <Button
              onPress={stopScanning}
              backgroundColor="$backgroundSecondary"
              borderColor="$borderSecondary"
              testID="stop-scan-button"
            >
              <Spinner size="small" color="$primary" />
              Stop Scanning
            </Button>
          )}
        </View>

        {/* Discovered Devices */}
        {discoveredDevices.length > 0 && (
          <View marginTop="$6">
            <Text fontSize="$5" fontWeight="600" paddingHorizontal="$3" marginBottom="$3">
              Available Devices
            </Text>
            {discoveredDevices.map(renderDeviceItem)}
          </View>
        )}

        {/* No devices found message */}
        {!isScanning && discoveredDevices.length === 0 && bluetoothEnabled && (
          <Container marginHorizontal="$3" marginTop="$6" alignItems="center">
            <SafeFontIcon name="hardware" size={48} color="$colorSecondary" />
            <Text fontSize="$4" color="$colorSecondary" textAlign="center" marginTop="$3">
              No Ledger devices found.{'\n'}
              Make sure your device is nearby and in pairing mode.
            </Text>
          </Container>
        )}
      </ScrollView>
    </View>
  )
}
