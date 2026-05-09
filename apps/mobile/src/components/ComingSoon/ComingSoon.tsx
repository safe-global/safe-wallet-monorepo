import React from 'react'
import { H6, Text, View } from 'tamagui'

export const ComingSoon = () => {
  return (
    <View testID="coming-soon" alignItems="center" justifyContent="center" gap="$4" height="100%">
      <H6 fontWeight={600}>Coming soon</H6>
      <Text textAlign="center" color="$colorSecondary" width="80%">
        This feature is coming soon.
      </Text>
    </View>
  )
}
