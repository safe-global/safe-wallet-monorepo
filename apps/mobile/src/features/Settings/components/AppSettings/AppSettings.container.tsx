import React from 'react'
import { Linking } from 'react-native'
import { router } from 'expo-router'

import { Text, View } from 'tamagui'
import { AppSettings } from './AppSettings'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { SafeFontIcon as Icon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { FloatingMenu } from '../FloatingMenu'
import { LoadableSwitch } from '@/src/components/LoadableSwitch'
import { useBiometrics } from '@/src/hooks/useBiometrics'
import { useNotificationManager } from '@/src/hooks/useNotificationManager'
import { useAppSelector } from '@/src/store/hooks'
import { selectAppNotificationStatus } from '@/src/store/notificationsSlice'
import { capitalize } from '@/src/utils/formatters'
import { SAFE_WEB_FEEDBACK_URL } from '@/src/config/constants'

export const AppSettingsContainer = () => {
  const { toggleBiometrics, isBiometricsEnabled, isLoading: isBiometricsLoading, getBiometricsUIInfo } = useBiometrics()
  const { enableNotification, disableNotification, isLoading: isNotificationsLoading } = useNotificationManager()
  const isAppNotificationEnabled = useAppSelector(selectAppNotificationStatus)
  const { themePreference, setThemePreference } = useTheme()

  const handleToggleNotifications = () => {
    if (isAppNotificationEnabled) {
      disableNotification()
    } else {
      enableNotification()
    }
  }

  const settingsSections = [
    {
      sectionName: 'Preferences',
      items: [
        {
          label: 'Currency',
          leftIcon: 'token',
          onPress: () => console.log('currency'),
          disabled: true,
          tag: 'Coming soon',
        },
        {
          label: 'Appearance',
          leftIcon: 'appearance',
          disabled: false,
          type: 'floating-menu',
          rightNode: (
            <FloatingMenu
              themeVariant={themePreference}
              onPressAction={({ nativeEvent }) => {
                const mode = nativeEvent.event as 'auto' | 'dark' | 'light'
                setThemePreference(mode)
              }}
              actions={[
                {
                  id: 'auto',
                  title: 'Auto',
                },
                {
                  id: 'dark',
                  title: 'Dark',
                },
                {
                  id: 'light',
                  title: 'Light',
                },
              ]}
            >
              <View flexDirection="row" alignItems="center" gap={4}>
                <Text color="$colorSecondary">{capitalize(themePreference)}</Text>
                <Icon name={'chevron-down'} />
              </View>
            </FloatingMenu>
          ),
        },
      ],
    },
    {
      sectionName: 'Security',
      items: [
        {
          label: getBiometricsUIInfo().label,
          leftIcon: getBiometricsUIInfo().icon,
          type: 'switch',
          rightNode: (
            <LoadableSwitch
              testID="toggle-app-biometrics"
              onChange={() => toggleBiometrics(!isBiometricsEnabled)}
              value={isBiometricsEnabled}
              isLoading={isBiometricsLoading}
              trackColor={{ true: '$primary' }}
            />
          ),
          disabled: false,
        },
        {
          label: 'Change passcode',
          leftIcon: 'lock',
          onPress: () => console.log('change passcode'),
          disabled: true,
          tag: 'Coming soon',
        },
      ],
    },
    {
      sectionName: 'General',
      items: [
        {
          label: 'Address book',
          leftIcon: 'address-book',
          type: 'menu',
          onPress: () => router.push('/address-book'),
          disabled: false,
        },
        {
          label: 'Allow notifications',
          leftIcon: 'bell',
          type: 'switch',
          rightNode: (
            <LoadableSwitch
              testID="toggle-global-notifications"
              onChange={handleToggleNotifications}
              value={isAppNotificationEnabled}
              isLoading={isNotificationsLoading}
              trackColor={{ true: '$primary' }}
            />
          ),
          disabled: false,
        },
      ],
    },
    {
      sectionName: 'About',
      items: [
        {
          label: 'Rate us',
          leftIcon: 'star',
          onPress: () => console.log('rate us'),
          disabled: true,
          type: 'external-link',
          tag: 'Coming soon',
        },
        {
          label: 'Follow us on X',
          leftIcon: 'twitter-x',
          onPress: () => Linking.openURL('https://x.com/safe?s=21'),
          disabled: false,
          type: 'external-link',
        },
        {
          label: 'Leave feedback',
          leftIcon: 'chat',
          onPress: () => Linking.openURL(SAFE_WEB_FEEDBACK_URL),
          disabled: false,
          type: 'external-link',
        },
        {
          label: 'Help center',
          leftIcon: 'question',
          onPress: () => Linking.openURL('https://help.safe.global/en/'),
          disabled: false,
          type: 'external-link',
        },
      ],
    },
  ]

  return <AppSettings sections={settingsSections} />
}
