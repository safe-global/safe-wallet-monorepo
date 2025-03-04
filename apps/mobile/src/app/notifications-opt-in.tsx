import React, { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { OptIn } from '@/src/components/OptIn'
import { router } from 'expo-router'
import { useNotificationManager } from '@/src/hooks/useNotificationManager'

function NotificationsOptIn() {
  const { isAppNotificationEnabled, enableNotificationsWithDelegate } = useNotificationManager()
  const colorScheme = useColorScheme()

  useEffect(() => {
    if (isAppNotificationEnabled) {
      router.replace('/(tabs)')
    }
  }, [isAppNotificationEnabled])

  const image =
    colorScheme === 'dark'
      ? require('@/assets/images/notifications-dark.png')
      : require('@/assets/images/notifications-light.png')

  return (
    <OptIn
      testID="notifications-opt-in-screen"
      title="Stay in the loop with account activity"
      description="Get notified when you receive assets, and when transactions require your action."
      image={image}
      isVisible
      ctaButton={{
        onPress: enableNotificationsWithDelegate,
        label: 'Enable notifications',
      }}
      secondaryButton={{
        onPress: () => router.back(),
        label: 'Maybe later',
      }}
    />
  )
}

export default NotificationsOptIn
