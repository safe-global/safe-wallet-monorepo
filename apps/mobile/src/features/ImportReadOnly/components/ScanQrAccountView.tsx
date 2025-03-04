import React from 'react'
import { Text, View } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { QrCamera } from '@/src/components/Camera'
import { ToastViewport } from '@tamagui/toast'
import { CameraPermissionStatus, Code } from 'react-native-vision-camera'

type QrCameraViewProps = {
  permission: CameraPermissionStatus
  isCameraActive: boolean
  onScan: (codes: Code[]) => void
  onEnterManuallyPress: () => void
}

export const QrCameraView = ({ permission, isCameraActive, onScan, onEnterManuallyPress }: QrCameraViewProps) => (
  <>
    <QrCamera
      permission={permission}
      isCameraActive={isCameraActive}
      onScan={onScan}
      heading={permission === 'denied' ? 'Camera access disabled' : 'Scan a QR code'}
      footer={
        <>
          <Text textAlign={'center'}>
            {permission === 'denied'
              ? 'Enabling camera will allow you to scan QR codes to import existing Safe Accounts and join new ones with a mobile signer.'
              : 'Scan the QR code of the account you want to import. You can find it under Receive or in the sidebar.'}
          </Text>
          <View alignItems="center" marginTop="$5">
            <SafeButton
              secondary
              icon={<SafeFontIcon name="copy" />}
              onPress={onEnterManuallyPress}
              testID={'enter-manually'}
            >
              Enter manually
            </SafeButton>
          </View>
        </>
      }
    />
    <ToastViewport multipleToasts={false} left={0} right={0} />
  </>
)
