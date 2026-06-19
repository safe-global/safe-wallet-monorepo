import { Code, useCameraPermission } from 'react-native-vision-camera'
import { useCallback, useRef, useState } from 'react'
import { useRouter, useFocusEffect } from 'expo-router'

import { resolveScannedAddress, INVALID_ADDRESS_MESSAGE } from '@/src/components/Camera'

export const useScan = () => {
  const router = useRouter()
  const hasScanned = useRef(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { hasPermission } = useCameraPermission()

  // Read the latest error inside the focus effect without listing it in deps (which would re-run the
  // effect and fight the live state).
  const errorRef = useRef(errorMessage)
  errorRef.current = errorMessage

  const handleFocusEffect = useCallback(() => {
    // Don't wake the camera behind a visible error overlay — the user resumes via Try again.
    if (!hasPermission || errorRef.current) {
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
      if (codes.length === 0 || !isCameraActive || hasScanned.current) {
        return
      }

      const code = codes[0].value || ''
      const resolved = resolveScannedAddress(code)

      if (resolved) {
        hasScanned.current = true
        setIsCameraActive(false)
        router.push(`/(import-accounts)/form?safeAddress=${resolved.address}`)
        return
      }

      // Surface the failure on the lens (camera off until Try again) instead of a transient toast.
      // Pausing the camera also avoids the burst of repeat frames vision-camera fires for the same code.
      setErrorMessage(INVALID_ADDRESS_MESSAGE)
      setIsCameraActive(false)
    },
    [isCameraActive, router],
  )

  const onTryAgain = useCallback(() => {
    setErrorMessage(null)
    if (hasPermission) {
      setIsCameraActive(true)
    }
  }, [hasPermission])

  return { onScan, isCameraActive, setIsCameraActive, errorMessage, onTryAgain }
}
