import { Camera, Code, useCameraPermission } from 'react-native-vision-camera'
import { Text, View } from 'tamagui'
import React, { useCallback, useEffect, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import { SafeButton } from '@/src/components/SafeButton'

import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { QrCamera } from '@/src/components/Camera'

export const ScanQrAccountContainer = () => {
  const router = useRouter()
  const [isCameraActive, setIsCameraActive] = useState(true)

  const permission = Camera.getCameraPermissionStatus()
  const { hasPermission, requestPermission } = useCameraPermission()

  useEffect(() => {
    if (hasPermission === false && permission === 'not-determined') {
      requestPermission()
    }
  }, [permission, hasPermission, requestPermission])

  useFocusEffect(
    // Callback should be wrapped in `React.useCallback` to avoid running the effect too often.
    useCallback(() => {
      // Invoked whenever the route is focused.
      setIsCameraActive(true)

      // Return function is invoked whenever the route gets out of focus.
      return () => {
        setIsCameraActive(false)
      }
    }, []),
  )

  const onScan = (codes: Code[]) => {
    if (codes.length > 0 && isCameraActive) {
      setIsCameraActive(false)
      router.push(`/(import-accounts)/form?safeAddress=${codes[0].value}`)
    }
  }

  return (
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
              onPress={async () => {
                router.push(`/(import-accounts)/form`)
              }}
            >
              Enter manually
            </SafeButton>
          </View>
        </>
      }
    />
  )
}
