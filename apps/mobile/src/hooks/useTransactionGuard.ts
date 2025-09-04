import { useLayoutEffect, useRef } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useGuard } from '@/src/context/GuardProvider'

export function useTransactionGuard(type: string) {
  const { getGuard } = useGuard()
  const router = useRouter()
  const hasShownAlert = useRef(false)
  const hasEverBeenAuthorized = useRef(false)
  const guard = getGuard(type)

  useLayoutEffect(() => {
    // Track if we've ever been authorized
    if (guard) {
      hasEverBeenAuthorized.current = true
    }

    // Only show alert if:
    // 1. User cannot sign AND
    // 2. We haven't shown alert before AND
    // 3. We've never been authorized (prevents alert after successful signing)
    if (!guard && !hasShownAlert.current && !hasEverBeenAuthorized.current) {
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
  }, [guard, router])

  return { guard }
}
