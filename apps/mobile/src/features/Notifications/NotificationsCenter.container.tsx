import { COMING_SOON_MESSAGE, COMING_SOON_TITLE } from '@/src/config/constants'
import React from 'react'
import { H3, Text, View } from 'tamagui'

export const NotificationsCenterContainer = () => {
  return (
    <View flex={1} alignItems="center" justifyContent="center">
      <H3 fontWeight={600}>{COMING_SOON_TITLE}</H3>
      <Text textAlign="center" color="$colorSecondary" width="70%" fontSize="$4">
        {COMING_SOON_MESSAGE}
      </Text>
    </View>
  )
}
