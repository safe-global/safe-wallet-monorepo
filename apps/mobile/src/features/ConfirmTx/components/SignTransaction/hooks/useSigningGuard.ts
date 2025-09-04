import { useLayoutEffect, useRef } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useGuard } from '@/src/context/GuardProvider'

export function useSigningGuard() {
  const { getGuard } = useGuard()
  const router = useRouter()
  const hasShownAlert = useRef(false)
  const hasEverBeenAuthorized = useRef(false)
  const canSign = getGuard('signing')

  useLayoutEffect(() => {
    // Track if we've ever been authorized
    if (canSign) {
      hasEverBeenAuthorized.current = true
    }

    // Only show alert if:
    // 1. User cannot sign AND
    // 2. We haven't shown alert before AND
    // 3. We've never been authorized (prevents alert after successful signing)
    if (!canSign && !hasShownAlert.current && !hasEverBeenAuthorized.current) {
      Alert.alert(
        'Something is fishy!',
        'You somehow got here, but you did not look at the transaction details. Go Back, inspect the transaction details and try again.',
        [
          {
            text: 'Go Back',
            onPress: () => router.back(),
          },
        ],
      )
      hasShownAlert.current = true
    }
  }, [canSign, router])

  return { canSign }
}
