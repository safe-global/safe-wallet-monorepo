import React, { useCallback, useRef, useState } from 'react'
import { Text } from 'tamagui'
import { Camera, Code, useCameraPermission } from 'react-native-vision-camera'
import { useRouter } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { isValidAddress } from '@safe-global/utils/utils/validation'
import { useToastController } from '@tamagui/toast'
import { ToastViewport } from '@tamagui/toast'
import { QrCamera } from '@/src/components/Camera'

const toastForValueShown: Record<string, boolean> = {}

export function ScanQrSendContainer() {
  const router = useRouter()
  const permission = Camera.getCameraPermissionStatus()
  const { hasPermission } = useCameraPermission()
  const hasScanned = useRef(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const toast = useToastController()

  const handleFocusEffect = useCallback(() => {
    if (!hasPermission) {
      return
    }

    setIsCameraActive(true)
    hasScanned.current = false

    return () => {
      setIsCameraActive(false)
    }
  }, [hasPermission])

  useFocusEffect(handleFocusEffect)

  const onScan = useCallback(
    (codes: Code[]) => {
      if (codes.length > 0 && isCameraActive && !hasScanned.current) {
        const code = codes[0].value || ''
        const { address } = parsePrefixedAddress(code)

        if (isValidAddress(address)) {
          hasScanned.current = true
          setIsCameraActive(false)
          router.navigate({
            pathname: '/(send)/recipient',
            params: { scannedAddress: address },
          })
        } else {
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

  const handleActivateCamera = useCallback(() => {
    setIsCameraActive(true)
  }, [])

  return (
    <>
      <QrCamera
        permission={permission}
        hasPermission={hasPermission}
        isCameraActive={isCameraActive}
        onScan={onScan}
        onActivateCamera={handleActivateCamera}
        heading="Scan an address"
        footer={<Text textAlign="center">Scan an Ethereum wallet address to continue</Text>}
      />
      <ToastViewport multipleToasts={false} left={0} right={0} />
    </>
  )
}
