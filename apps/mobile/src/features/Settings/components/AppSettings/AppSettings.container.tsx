import React from 'react'
import { AppSettings } from './AppSettings'
import { SafeFontIcon as Icon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { router } from 'expo-router'
import { FloatingMenu } from '../FloatingMenu'

export const AppSettingsContainer = () => {
  const settingsSections = [
    {
      sectionName: 'Preferences',
      items: [
        {
          label: 'Currency',
          leftIcon: 'bell',
          onPress: () => router.push('/currency-selector'),
          disabled: true,
        },
        {
          label: 'Appearance',
          leftIcon: 'address-book',
          onPress: () => router.push('/address-book'),
          disabled: true,
          rightNode: (
            <FloatingMenu
              onPressAction={() => {}}
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
              <Icon name={'chevron-right'} />
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
          leftIcon: 'bell',
          onPress: () => router.push('/notifications-settings'),
          disabled: true,
        },
        {
          label: 'Change passcode',
          leftIcon: 'address-book',
          onPress: () => router.push('/address-book'),
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
          disabled: true,
        },
      ],
    },
    {
      sectionName: 'About',
      items: [
        {
          label: 'Rate us',
          leftIcon: 'star',
          onPress: () => router.push('/rate-us'),
          disabled: true,
        },
        {
          label: 'Follow us on X',
          leftIcon: 'star',
          onPress: () => router.push('/rate-us'),
          disabled: true,
        },
        {
          label: 'Leave feedback',
          leftIcon: 'star',
          onPress: () => router.push('/follow-us'),
          disabled: true,
        },
        {
          label: 'Help center',
          leftIcon: 'share',
          onPress: () => router.push('/leave-feedback'),
          disabled: true,
        },
      ],
    },
  ]

  return <AppSettings sections={settingsSections} />
}
