import React from 'react'
import { useColorScheme } from 'react-native'
import { OptIn } from '@/src/components/OptIn'
import useNotifications from '@/src/hooks/useNotifications'
import { router } from 'expo-router'

function NotificationsOptIn() {
  const { enableNotifications, isAppNotificationEnabled } = useNotifications(true)
  const colorScheme = useColorScheme()

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
      isVisible={!isAppNotificationEnabled}
      ctaButton={{
        onPress: enableNotifications,
        label: 'Enable notifications',
      }}
      secondaryButton={{
        onPress: () => router.replace('/(tabs)'),
        label: 'Maybe later',
      }}
    />
  )
}

export default NotificationsOptIn
