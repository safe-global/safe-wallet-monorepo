import { Camera, Code, useCameraPermission } from 'react-native-vision-camera'
import React, { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'

import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { isValidAddress } from '@safe-global/utils/utils/validation'
import { useToastController } from '@tamagui/toast'
import { QrCameraView } from '@/src/features/ImportReadOnly/components/ScanQrAccountView'

const toastForValueShown: Record<string, boolean> = {}

export const ScanQrAccountContainer = () => {
  const router = useRouter()
  const [isCameraActive, setIsCameraActive] = useState(false)
  const toast = useToastController()

  const permission = Camera.getCameraPermissionStatus()
  const { hasPermission, requestPermission } = useCameraPermission()

  const onScan = useCallback(
    (codes: Code[]) => {
      if (codes.length > 0 && isCameraActive) {
        const code = codes[0].value || ''
        const { address } = parsePrefixedAddress(code)
        if (isValidAddress(address)) {
          setIsCameraActive(false)
          router.push(`/(import-accounts)/form?safeAddress=${address}`)
        } else {
          // the camera constantly sends us the qr code value, so we would be sending the toast multiple times
          // at one point the view was crashing because of this
          // not sure what the real cause for that is, but this is a workaround
          if (!toastForValueShown[code]) {
            toastForValueShown[code] = true
            toast.show('Not a valid address', {
              native: false,
              duration: 2000,
            })
          }
        }
      }
    },
    [isCameraActive, router, toast],
  )

  const onEnterManuallyPress = useCallback(async () => {
    router.push(`/(import-accounts)/form`)
  }, [router])

  const handleActivateCamera = useCallback(() => {
    setIsCameraActive(true)
  }, [])

  return (
    <QrCameraView
      permission={permission}
      hasPermission={hasPermission}
      requestPermission={requestPermission}
      isCameraActive={isCameraActive}
      onScan={onScan}
      onActivateCamera={handleActivateCamera}
      onEnterManuallyPress={onEnterManuallyPress}
    />
  )
}
