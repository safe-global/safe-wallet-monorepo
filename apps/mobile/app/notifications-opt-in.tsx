import React from 'react'
import { useColorScheme } from 'react-native'
import { OptIn } from '@/src/components/OptIn'
import useNotifications from '@/src/hooks/useNotifications'
import { router, useFocusEffect } from 'expo-router'

function NotificationsOptIn() {
  const { enableNotifications, isAppNotificationEnabled } = useNotifications()
  const colorScheme = useColorScheme()

  useFocusEffect(() => {
    if (isAppNotificationEnabled) {
      router.replace('/(tabs)')
    }
  })

  const image =
    colorScheme === 'dark'
      ? require('@/assets/images/notifications-dark.png')
      : require('@/assets/images/notifications-light.png')

  return (
    <OptIn
      testID="notifications-opt-in"
      title="Stay in the loop with account activity"
      description="Get notified when you receive assets, and when transactions require your action."
      image={image}
      isVisible
      ctaButton={{
        onPress: enableNotifications,
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
