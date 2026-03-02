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
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'

export function ScanQrSendContainer() {
  const router = useRouter()
  const permission = Camera.getCameraPermissionStatus()
  const { hasPermission } = useCameraPermission()
  const hasScanned = useRef(false)
  const toastForValueShown = useRef<Set<string>>(new Set())
  const [isCameraActive, setIsCameraActive] = useState(false)
  const toast = useToastController()
  const activeChain = useAppSelector(selectActiveChain)

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

  const showInvalidAddressToast = useCallback(
    (code: string) => {
      if (toastForValueShown.current.has(code)) {
        return
      }

      toastForValueShown.current.add(code)
      toast.show('Not a valid address', {
        native: false,
        duration: 2000,
      })
    },
    [toast],
  )

  const onScan = useCallback(
    (codes: Code[]) => {
      const canProcess = codes.length > 0 && isCameraActive && !hasScanned.current

      if (!canProcess) {
        return
      }

      const code = codes[0].value || ''
      const { address, prefix } = parsePrefixedAddress(code)

      if (!isValidAddress(address)) {
        showInvalidAddressToast(code)
        return
      }

      if (prefix && activeChain?.shortName && prefix !== activeChain.shortName) {
        toast.show(`Address is for ${prefix}, but active chain is ${activeChain.shortName}`, {
          native: false,
          duration: 3000,
        })
      }

      hasScanned.current = true
      setIsCameraActive(false)
      router.navigate({
        pathname: '/(send)/recipient',
        params: { scannedAddress: address },
      })
    },
    [isCameraActive, router, showInvalidAddressToast, activeChain, toast],
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
