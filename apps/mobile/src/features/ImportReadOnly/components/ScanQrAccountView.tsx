import React from 'react'
import { Text, View } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { QrCamera, ScanErrorOverlay } from '@/src/components/Camera'
import { CameraPermissionStatus, Code } from 'react-native-vision-camera'

type QrCameraViewProps = {
  permission: CameraPermissionStatus
  isCameraActive: boolean
  onScan: (codes: Code[]) => void
  onEnterManuallyPress: () => void
  onActivateCamera: () => void
  onRequestPermission: () => void | Promise<unknown>
  onPressSettings: () => void
  errorMessage: string | null
  onTryAgain: () => void
}

const headingForPermission = (permission: CameraPermissionStatus): string => {
  switch (permission) {
    case 'denied':
      return 'Camera access is off'
    case 'restricted':
      return 'Camera access is restricted'
    case 'not-determined':
      return 'Allow camera access'
    default:
      return 'Scan a QR code'
  }
}

const bodyForPermission = (permission: CameraPermissionStatus): string => {
  switch (permission) {
    case 'denied':
      return 'Enable camera access to scan QR codes for adding Safe accounts and connecting wallets. You can change this in Settings.'
    case 'restricted':
      return 'Camera access is disabled by a device restriction. If you manage this device, you can change it in Settings.'
    case 'not-determined':
      return 'Safe needs camera access to scan QR codes for adding Safe accounts and connecting wallets.'
    default:
      return 'Scan the QR code of the account you want to import. You can find it under Receive or in the sidebar.'
  }
}

export const QrCameraView = ({
  permission,
  isCameraActive,
  onScan,
  onEnterManuallyPress,
  onActivateCamera,
  onRequestPermission,
  onPressSettings,
  errorMessage,
  onTryAgain,
}: QrCameraViewProps) => (
  <QrCamera
    permission={permission}
    isCameraActive={isCameraActive}
    onScan={onScan}
    onActivateCamera={onActivateCamera}
    onRequestPermission={onRequestPermission}
    onPressSettings={onPressSettings}
    heading={errorMessage ? undefined : headingForPermission(permission)}
    lensTone={errorMessage ? 'error' : 'neutral'}
    dimLens={Boolean(errorMessage)}
    centerOverlay={
      errorMessage ? (
        <ScanErrorOverlay message={errorMessage} onTryAgain={onTryAgain} testID="import-scan-try-again" />
      ) : undefined
    }
    footer={
      <>
        <Text textAlign="center">{bodyForPermission(permission)}</Text>
        <View alignItems="center" marginTop="$5">
          <SafeButton
            secondary
            icon={<SafeFontIcon name="copy" size={18} />}
            onPress={onEnterManuallyPress}
            testID={'enter-manually'}
            size="$sm"
          >
            Enter manually
          </SafeButton>
        </View>
      </>
    }
  />
)
