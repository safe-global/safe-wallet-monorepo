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
import { capitalize } from '@/src/utils/formatters'

export const AppSettingsContainer = () => {
  const { toggleBiometrics, isBiometricsEnabled, isLoading } = useBiometrics()
  const { themePreference, setThemePreference } = useTheme()

  const settingsSections = [
    {
      sectionName: 'Preferences',
      items: [
        {
          label: 'Currency',
          leftIcon: 'token',
          onPress: () => console.log('currency'),
          disabled: true,
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
          label: 'Face ID',
          leftIcon: 'face-id',
          type: 'switch',
          rightNode: (
            <LoadableSwitch
              testID="toggle-app-biometrics"
              onChange={() => toggleBiometrics(!isBiometricsEnabled)}
              value={isBiometricsEnabled}
              isLoading={isLoading}
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
      ],
    },
    {
      sectionName: 'About',
      items: [
        {
          label: 'Rate us',
          leftIcon: 'star',
          onPress: () => console.log('rate us'),
          disabled: false,
          type: 'external-link',
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
          onPress: () => console.log('leave feedback'),
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
