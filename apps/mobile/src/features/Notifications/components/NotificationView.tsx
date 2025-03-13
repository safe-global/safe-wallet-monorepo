import { Text, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { Switch } from 'react-native'
import React from 'react'
import { Container } from '@/src/components/Container'
import { NOTIFICATION_ACCOUNT_TYPE } from '@/src/store/constants'
import { NotificationPermissions } from './NotificationPermissions'

type Props = {
  onChange: () => void
  value: boolean
}
export const NotificationView = ({ onChange, value }: Props) => {
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

      <NotificationPermissions accountType={NOTIFICATION_ACCOUNT_TYPE.OWNER} isNotificationEnabled={value} />
    </View>
  )
}

// TODO: Check best way to handle accountType