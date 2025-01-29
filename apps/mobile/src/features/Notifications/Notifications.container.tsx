import React, { useCallback } from 'react'
import { Switch } from 'react-native'
import { View, Text } from 'tamagui'

import { useAppSelector, useAppDispatch } from '@/src/store/hooks'
import { SafeListItem } from '@/src/components/SafeListItem'
import { selectAppNotificationStatus, toggleAppNotifications } from '@/src/store/notificationsSlice'

export const NotificationsContainer = () => {
  const dispatch = useAppDispatch()
  const isAppNotificationEnabled = useAppSelector(selectAppNotificationStatus)

  const handleToggleAppNotifications = useCallback(() => {
    dispatch(toggleAppNotifications(!isAppNotificationEnabled))
  }, [isAppNotificationEnabled])

  return (
    <View paddingHorizontal="$4" marginTop="$2" style={{ flex: 1 }}>
      <Text fontSize="$8" fontWeight={600} marginBottom="$2">
        Notifications
      </Text>
      <Text marginBottom="$4">
        Stay up-to-date and get notified about activities in your account, based on your needs.
      </Text>
      <SafeListItem
        label={'Allow notifications'}
        rightNode={
          <Switch
            testID="toggle-app-notifications"
            onChange={handleToggleAppNotifications}
            value={isAppNotificationEnabled}
            trackColor={{ true: '$primary' }}
          />
        }
      />
    </View>
  )
}
