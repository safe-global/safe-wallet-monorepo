import React, { useCallback, useEffect, useRef } from 'react'
import { useColorScheme, AppState } from 'react-native'
import { OptIn } from '@/src/components/OptIn'
import useNotifications from '@/src/hooks/useNotifications'
import NotificationsService from '@/src/services/notifications/NotificationService'
import { router } from 'expo-router'
import { useDelegateKey } from '../hooks/useDelegateKey'
import { useAuthGetNonceV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import Logger from '@/src/utils/logger'

function NotificationsOptIn() {
  const { enableNotifications, isAppNotificationEnabled } = useNotifications()
  const appState = useRef(AppState.currentState)
  const { data } = useAuthGetNonceV1Query()
  const { createDelegate } = useDelegateKey()

  const colorScheme = useColorScheme()

  const toggleNotificationsOn = useCallback(async () => {
    try {
      const deviceNotificationStatus = await NotificationsService.isDeviceNotificationEnabled()
      if (deviceNotificationStatus) {
        enableNotifications()
        await createDelegate(data)
      } else {
        await NotificationsService.getAllPermissions(true)
      }
    } catch (error) {
      Logger.error('Error enabling push notifications', error)
    }
  }, [data])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const deviceNotificationStatus = await NotificationsService.isDeviceNotificationEnabled()
        if (deviceNotificationStatus && !isAppNotificationEnabled) {
          enableNotifications()
          await createDelegate(data)
        }
      }

      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [])

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
        onPress: toggleNotificationsOn,
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
