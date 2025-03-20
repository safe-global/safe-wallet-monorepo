import React, { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { OptIn } from '@/src/components/OptIn'
import { router } from 'expo-router'
import { useNotificationManager } from '@/src/hooks/useNotificationManager'
import { useAppDispatch } from '../store/hooks'
import { updatePromptAttempts } from '@/src/store/notificationsSlice'

function NotificationsOptIn() {
  const dispatch = useAppDispatch()
  const { isAppNotificationEnabled, enableNotification, isLoading } = useNotificationManager()
  const colorScheme = useColorScheme()

  useEffect(() => {
    if (isAppNotificationEnabled) {
      router.replace('/(tabs)')
    }
  }, [isAppNotificationEnabled])

  const handleReject = () => {
    dispatch(updatePromptAttempts(1))
    router.back()
  }

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
      isLoading={isLoading}
      ctaButton={{
        onPress: enableNotification,
        label: 'Enable notifications',
      }}
      secondaryButton={{
        onPress: handleReject,
        label: 'Maybe later',
      }}
    />
  )
}

export default NotificationsOptIn
