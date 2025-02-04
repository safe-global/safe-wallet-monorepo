import React from 'react'
import { Switch } from 'react-native'
import { Text, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { NotificationPermissions } from './NotificationPermissions'
import { useNotificationGTWPermissions } from '@/src/hooks/useNotificationGTWPermissions'

type Props = {
  onChange: () => void
  value: boolean
}
export const NotificationView = ({ onChange, value }: Props) => {
  const { getAccountType } = useNotificationGTWPermissions()

  return (
    <View paddingHorizontal="$4" marginTop="$2" style={{ flex: 1 }} testID={'notifications-popup-screen'}>
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
            onChange={onChange}
            value={value}
            trackColor={{ true: '$primary' }}
          />
        }
      />

      <NotificationPermissions accountType={getAccountType().accountType} isNotificationEnabled={value} />
    </View>
  )
}
