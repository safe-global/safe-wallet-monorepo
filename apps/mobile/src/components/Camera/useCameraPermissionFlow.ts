import { useCallback, useState } from 'react'
import { Linking } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Camera, CameraPermissionStatus } from 'react-native-vision-camera'

/**
 * Owns the camera permission state for a screen and exposes the only sanctioned
 * paths to request permission and to open Settings. Callers must never invoke
 * `openSettings` as a side effect of `requestPermission` resolving with
 * `'denied'` — Apple guideline 5.1.1(iv) forbids redirecting the user to
 * Settings immediately after they deny the OS prompt.
 */
export const useCameraPermissionFlow = () => {
  const [permission, setPermission] = useState<CameraPermissionStatus>(() => Camera.getCameraPermissionStatus())

  useFocusEffect(
    useCallback(() => {
      setPermission(Camera.getCameraPermissionStatus())
    }, []),
  )

  const requestPermission = useCallback(async () => {
    const next = await Camera.requestCameraPermission()
    setPermission(next)
    return next
  }, [])

  const openSettings = useCallback(() => {
    void Linking.openSettings()
  }, [])

  return { permission, requestPermission, openSettings }
}
