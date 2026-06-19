import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'

import { QrCameraView } from '@/src/features/ImportReadOnly/components/ScanQrAccountView'
import { useScan } from '@/src/features/ImportReadOnly/hooks/useScan'
import { useCameraPermissionFlow } from '@/src/components/Camera/useCameraPermissionFlow'

export const ScanQrAccountContainer = () => {
  const router = useRouter()
  const { permission, requestPermission, openSettings } = useCameraPermissionFlow()
  const { onScan, isCameraActive, setIsCameraActive, errorMessage, onTryAgain } = useScan()

  const onEnterManuallyPress = useCallback(async () => {
    router.push(`/(import-accounts)/form`)
  }, [router])

  const handleActivateCamera = useCallback(() => {
    setIsCameraActive(true)
  }, [setIsCameraActive])

  return (
    <QrCameraView
      permission={permission}
      isCameraActive={isCameraActive}
      onScan={onScan}
      onActivateCamera={handleActivateCamera}
      onRequestPermission={requestPermission}
      onPressSettings={openSettings}
      onEnterManuallyPress={onEnterManuallyPress}
      errorMessage={errorMessage}
      onTryAgain={onTryAgain}
    />
  )
}
