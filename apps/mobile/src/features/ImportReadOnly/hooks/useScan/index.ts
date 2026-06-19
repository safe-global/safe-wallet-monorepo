import { Code, useCameraPermission } from 'react-native-vision-camera'
import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { useFocusEffect } from 'expo-router'

import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { isValidAddress } from '@safe-global/utils/utils/validation'

const INVALID_ADDRESS_MESSAGE = 'Not a valid address'

export const useScan = () => {
  const router = useRouter()
  const hasScanned = useRef(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { hasPermission } = useCameraPermission()

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
      if (codes.length === 0 || !isCameraActive || hasScanned.current) {
        return
      }

      const code = codes[0].value || ''
      const { address } = parsePrefixedAddress(code)

      if (isValidAddress(address)) {
        hasScanned.current = true
        setIsCameraActive(false)
        router.push(`/(import-accounts)/form?safeAddress=${address}`)
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
