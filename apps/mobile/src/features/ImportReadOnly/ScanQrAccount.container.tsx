import { Camera, Code, useCameraPermission } from 'react-native-vision-camera'
import React, { useCallback, useEffect, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'

import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { isValidAddress } from '@safe-global/utils/utils/validation'
import { useToastController } from '@tamagui/toast'
import { QrCameraView } from '@/src/features/ImportReadOnly/components/ScanQrAccountView'

const toastForValueShown: Record<string, boolean> = {}

export const ScanQrAccountContainer = () => {
  const router = useRouter()
  const [isCameraActive, setIsCameraActive] = useState(true)
  const toast = useToastController()

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

  return (
    <QrCameraView
      permission={permission}
      isCameraActive={isCameraActive}
      onScan={onScan}
      onEnterManuallyPress={onEnterManuallyPress}
    />
  )
}
