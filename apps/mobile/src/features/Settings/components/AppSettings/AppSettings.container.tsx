import React from 'react'
import { Text, View } from 'tamagui'
import { AppSettings } from './AppSettings'
import { useTheme } from '@/src/theme/provider/safeTheme'
import { SafeFontIcon as Icon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { router } from 'expo-router'
import { FloatingMenu } from '../FloatingMenu'
import { LoadableSwitch } from '@/src/components/LoadableSwitch'
import { useBiometrics } from '@/src/hooks/useBiometrics'
import { capitalize } from '@/src/utils/formatters'
import { Linking } from 'react-native'

export const AppSettingsContainer = () => {
  const { enableBiometrics, isBiometricsEnabled, isLoading } = useBiometrics()
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
          onPress: () => console.log('appearance'),
          disabled: false,
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
                <Icon name={'chevron-right'} />
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
          leftIcon: 'appearance',
          rightNode: (
            <LoadableSwitch
              testID="toggle-app-biometrics"
              onChange={enableBiometrics}
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
          leftIcon: 'token',
          onPress: () => console.log('rate us'),
          disabled: false,
        },
        {
          label: 'Follow us on X',
          leftIcon: 'sign',
          onPress: () => Linking.openURL('https://x.com/safe?s=21'),
          disabled: false,
        },
        {
          label: 'Leave feedback',
          leftIcon: 'chat',
          onPress: () => console.log('leave feedback'),
          disabled: false,
        },
        {
          label: 'Help center',
          leftIcon: 'question',
          onPress: () => Linking.openURL('https://help.safe.global/en/'),
          disabled: false,
        },
      ],
    },
  ]

  return <AppSettings sections={settingsSections} />
}
