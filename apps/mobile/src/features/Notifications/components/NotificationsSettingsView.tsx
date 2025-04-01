import React from 'react'
import { Switch, StyleSheet } from 'react-native'
import { Text, View } from 'tamagui'
import { CircleSnail } from 'react-native-progress'
import { SafeListItem } from '@/src/components/SafeListItem'
import { NotificationPermissions } from './NotificationPermissions'
import { useNotificationGTWPermissions } from '@/src/hooks/useNotificationGTWPermissions'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useAppSelector } from '@/src/store/hooks'

type Props = {
  onChange: () => void
  value: boolean
  isLoading?: boolean
}

interface LoadableSwitchProps {
  isLoading?: boolean
  value: boolean
  onChange: () => void
  testID?: string
  trackColor?: {
    true: string
    false?: string
  }
}

const LoadableSwitch: React.FC<LoadableSwitchProps> = ({
  isLoading = false,
  value,
  onChange,
  testID,
  trackColor = { true: '$primary' },
}) => {
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <CircleSnail size={24} color={value ? trackColor.true : '#ccc'} />
      </View>
    )
  }

  return <Switch testID={testID} onChange={onChange} value={value} trackColor={trackColor} />
}

export const NotificationsSettingsView = ({ onChange, value, isLoading = false }: Props) => {
  const activeSafe = useAppSelector(selectActiveSafe)
  const { getAccountType } = useNotificationGTWPermissions(activeSafe?.address as `0x${string}`)

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
          <LoadableSwitch
            testID="toggle-app-notifications"
            onChange={onChange}
            value={value}
            isLoading={isLoading}
            trackColor={{ true: '$primary' }}
          />
        }
      />

      <NotificationPermissions accountType={getAccountType().accountType} isNotificationEnabled={value} />
    </View>
  )
}

const styles = StyleSheet.create({
  loaderContainer: {
    width: 51,
    height: 31,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
