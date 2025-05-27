import { Code, useCameraPermission } from 'react-native-vision-camera'
import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'

import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { isValidAddress } from '@safe-global/utils/utils/validation'
import { useToastController } from '@tamagui/toast'

const toastForValueShown: Record<string, boolean> = {}

export const useScan = () => {
  const router = useRouter()
  const hasScanned = useRef(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const toast = useToastController()
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
      if (codes.length > 0 && isCameraActive && !hasScanned.current) {
        const code = codes[0].value || ''
        const { address } = parsePrefixedAddress(code)

        if (isValidAddress(address)) {
          hasScanned.current = true
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
    [isCameraActive, router, toast, setIsCameraActive],
  )

  return { onScan, isCameraActive, setIsCameraActive }
}
