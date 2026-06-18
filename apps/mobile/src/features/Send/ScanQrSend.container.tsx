import React, { useCallback, useRef, useState } from 'react'
import { Text } from 'tamagui'
import { Code } from 'react-native-vision-camera'
import { useFocusEffect } from 'expo-router'
import { ToastViewport } from '@tamagui/toast'
import { QrCamera } from '@/src/components/Camera'
import { useCameraPermissionFlow } from '@/src/components/Camera/useCameraPermissionFlow'
import { resolveScannedAddress, useScannedAddressToSend } from './hooks/useScannedAddressToSend'

const headingForPermission = (permission: ReturnType<typeof useCameraPermissionFlow>['permission']): string => {
  switch (permission) {
    case 'denied':
      return 'Camera access is off'
    case 'restricted':
      return 'Camera access is restricted'
    case 'not-determined':
      return 'Allow camera access'
    default:
      return 'Scan an address'
  }
}

const bodyForPermission = (permission: ReturnType<typeof useCameraPermissionFlow>['permission']): string => {
  switch (permission) {
    case 'denied':
      return 'Enable camera access to scan an Ethereum wallet address. You can change this in Settings.'
    case 'restricted':
      return 'Camera access is disabled by a device restriction. If you manage this device, you can change it in Settings.'
    case 'not-determined':
      return 'Safe needs camera access to scan an Ethereum wallet address.'
    default:
      return 'Scan an Ethereum wallet address to continue'
  }
}

export function ScanQrSendContainer() {
  const { permission, requestPermission, openSettings } = useCameraPermissionFlow()
  const hasScanned = useRef(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const { showInvalidAddressToast, warnChainMismatch, navigateToRecipient } = useScannedAddressToSend()

  const handleFocusEffect = useCallback(() => {
    if (permission !== 'granted') {
      return
    }

    setIsCameraActive(true)
    hasScanned.current = false

    return () => {
      setIsCameraActive(false)
    }
  }, [permission])

  useFocusEffect(handleFocusEffect)

  const onScan = useCallback(
    (codes: Code[]) => {
      if (codes.length === 0 || !isCameraActive || hasScanned.current) {
        return
      }

      const code = codes[0].value || ''
      const resolved = resolveScannedAddress(code)

      if (!resolved) {
        showInvalidAddressToast(code)
        return
      }

      warnChainMismatch(resolved.prefix)
      hasScanned.current = true
      setIsCameraActive(false)
      navigateToRecipient(resolved.address)
    },
    [isCameraActive, showInvalidAddressToast, warnChainMismatch, navigateToRecipient],
  )

  const handleActivateCamera = useCallback(() => {
    setIsCameraActive(true)
  }, [])

  return (
    <>
      <QrCamera
        permission={permission}
        isCameraActive={isCameraActive}
        onScan={onScan}
        onActivateCamera={handleActivateCamera}
        onRequestPermission={requestPermission}
        onPressSettings={openSettings}
        heading={headingForPermission(permission)}
        footer={<Text textAlign="center">{bodyForPermission(permission)}</Text>}
      />
      <ToastViewport multipleToasts={false} left={0} right={0} />
    </>
  )
}
