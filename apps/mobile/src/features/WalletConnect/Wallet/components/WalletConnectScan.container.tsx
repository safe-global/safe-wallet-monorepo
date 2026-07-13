import React, { useCallback } from 'react'
import { ActivityIndicator } from 'react-native'
import type { CameraPermissionStatus } from 'react-native-vision-camera'
import { Text, View, YStack } from 'tamagui'
import { router } from 'expo-router'
import { QrCamera, ScanErrorOverlay, resolveScannedAddress } from '@/src/components/Camera'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useScannedAddressToSend } from '@/src/features/Send/hooks/useScannedAddressToSend'
import { useWalletConnectScan, type ScanStatus } from '../hooks/useWalletConnectScan'

const GRANTED_FOOTER = 'Scan an Ethereum wallet address or connect to a desktop app'

const headingForPermission = (permission: CameraPermissionStatus): string => {
  switch (permission) {
    case 'denied':
      return 'Camera access is off'
    case 'restricted':
      return 'Camera access is restricted'
    case 'not-determined':
      return 'Allow camera access'
    default:
      return ''
  }
}

const bodyForPermission = (permission: CameraPermissionStatus): string => {
  switch (permission) {
    case 'denied':
      return 'Enable camera access to scan a WalletConnect QR code. You can change this in Settings.'
    case 'restricted':
      return 'Camera access is disabled by a device restriction. If you manage this device, you can change it in Settings.'
    case 'not-determined':
      return 'Safe needs camera access to scan a WalletConnect QR code.'
    default:
      return GRANTED_FOOTER
  }
}

function ConnectingOverlay() {
  return (
    <YStack alignItems="center" gap="$2">
      <ActivityIndicator color="white" />
      <Text color="$color" fontWeight="600">
        Connecting…
      </Text>
    </YStack>
  )
}

function CenterOverlay({
  status,
  errorMessage,
  onTryAgain,
}: {
  status: ScanStatus
  errorMessage: string
  onTryAgain: () => void
}) {
  switch (status) {
    case 'connecting':
      return <ConnectingOverlay />
    case 'error':
      return <ScanErrorOverlay message={errorMessage} onTryAgain={onTryAgain} testID="wc-scan-try-again" />
    default:
      return null
  }
}

export function WalletConnectScanContainer({ isActive = true }: { isActive?: boolean } = {}) {
  const { warnChainMismatch, navigateToRecipient } = useScannedAddressToSend()

  // A scanned Ethereum address leaves the scanner modal and lands on the Send recipient screen,
  // matching the home-screen Send button (replace so back returns to the tabs, not the scanner).
  const onAddressScanned = useCallback(
    (raw: string) => {
      const resolved = resolveScannedAddress(raw)
      if (!resolved) {
        return false
      }
      warnChainMismatch(resolved.prefix)
      navigateToRecipient(resolved.address, 'replace')
      return true
    },
    [warnChainMismatch, navigateToRecipient],
  )

  const {
    status,
    errorMessage,
    isCameraActive,
    permission,
    requestPermission,
    openSettings,
    onScan,
    onTryAgain,
    onActivateCamera,
  } = useWalletConnectScan({ isActive, onAddressScanned })

  const granted = permission === 'granted'

  // Overlay only owns the lens while connecting/erroring; in the scanning state we leave it
  // undefined so QrCamera keeps its own tap-to-reactivate CTA. Otherwise QrCamera shows its
  // permission CTA + heading.
  const centerOverlay =
    granted && status !== 'scanning' ? (
      <CenterOverlay status={status} errorMessage={errorMessage} onTryAgain={onTryAgain} />
    ) : undefined

  return (
    <QrCamera
      permission={permission}
      isCameraActive={isCameraActive}
      onScan={onScan}
      onActivateCamera={onActivateCamera}
      onRequestPermission={requestPermission}
      onPressSettings={openSettings}
      heading={granted ? null : headingForPermission(permission)}
      lensTone={status === 'error' ? 'error' : 'neutral'}
      dimLens={status !== 'scanning'}
      centerOverlay={centerOverlay}
      footer={
        <YStack gap="$3">
          <Text textAlign="center" color="$color">
            {granted ? GRANTED_FOOTER : bodyForPermission(permission)}
          </Text>
          {__DEV__ && (
            <View alignItems="center" marginTop="$5">
              <SafeButton
                secondary
                size="$sm"
                icon={<SafeFontIcon name="copy" size={18} />}
                onPress={() => router.push('/wallet-connect-manual')}
                testID="wc-enter-manually"
              >
                Enter manually
              </SafeButton>
            </View>
          )}
        </YStack>
      }
    />
  )
}
