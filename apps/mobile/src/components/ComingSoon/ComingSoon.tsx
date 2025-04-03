import React from 'react'
import { H5, Text, View } from 'tamagui'

export const ComingSoon = () => {
  return (
    <View testID="coming-soon" alignItems="center" gap="$4" marginTop={'$4'}>
      <H5 fontWeight={600}>Coming soon</H5>
      <Text textAlign="center" color="$colorSecondary" width="80%">
        We’re working on this message view. Details aren’t available just yet—but they will be soon.
      </Text>
    </View>
  )
}
