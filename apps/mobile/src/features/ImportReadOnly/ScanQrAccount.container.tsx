import { Camera, useCameraPermission } from 'react-native-vision-camera'
import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'

import { QrCameraView } from '@/src/features/ImportReadOnly/components/ScanQrAccountView'
import { useScan } from '@/src/features/ImportReadOnly/hooks/useScan'

export const ScanQrAccountContainer = () => {
  const router = useRouter()
  const permission = Camera.getCameraPermissionStatus()
  const { hasPermission } = useCameraPermission()
  const { onScan, isCameraActive, setIsCameraActive } = useScan()

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
      isCameraActive={isCameraActive}
      onScan={onScan}
      onActivateCamera={handleActivateCamera}
      onEnterManuallyPress={onEnterManuallyPress}
    />
  )
}
