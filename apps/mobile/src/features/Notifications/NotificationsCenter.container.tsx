import React from 'react'
import { H3, Text, View } from 'tamagui'

export const NotificationsCenterContainer = () => {
  return (
    <View flex={1} alignItems="center" justifyContent="center">
      <H3 fontWeight={600}>Coming soon</H3>
      <Text textAlign="center" color="$colorSecondary" width="70%" fontSize="$4">
        This feature is coming soon.
      </Text>
    </View>
  )
}
