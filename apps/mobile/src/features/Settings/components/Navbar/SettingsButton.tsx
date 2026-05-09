import { Button } from 'tamagui'
import { router } from 'expo-router'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import React from 'react'

export const SettingsButton = () => {
  return (
    <Button
      testID={'settings-screen-header-settings-button'}
      size={'$8'}
      circular={true}
      backgroundColor={'$backgroundSkeleton'}
      onPress={() => {
        router.push('/app-settings')
      }}
    >
      <SafeFontIcon name={'settings'} size={16} />
    </Button>
  )
}
