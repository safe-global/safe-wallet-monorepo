import React from 'react'
import { H6, Text, View } from 'tamagui'

export const PositionsEmpty = () => {
  return (
    <View testID="positions-empty" alignItems="center" gap="$4" marginTop="$4">
      <H6 fontWeight={600}>No positions yet</H6>
      <Text textAlign="center" color="$colorSecondary" width="80%">
        Your DeFi positions will appear here once you have assets deposited in protocols like Aave, Lido, or others.
      </Text>
    </View>
  )
}
