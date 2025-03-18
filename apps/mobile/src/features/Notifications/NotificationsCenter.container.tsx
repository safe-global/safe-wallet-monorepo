import React from 'react'
import { H3, Text, View } from 'tamagui'

export const NotificationsCenterContainer = () => {
  return (
    <View testID="empty-token" alignItems="center" gap="$4" marginTop="$6">
      <H3 fontWeight={600}>Coming soon</H3>
      <Text textAlign="center" color="$colorSecondary" width="70%" fontSize="$4">
        This feature is coming soon.
      </Text>
    </View>
  )
}
