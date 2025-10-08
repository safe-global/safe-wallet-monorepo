import React from 'react'
import { View, Text } from 'tamagui'

export const RelayUnavailable = () => {
  return (
    <View justifyContent="space-between" alignItems="center">
      <Text color="$colorSecondary" fontSize="$4">
        You reached a limit with free transactions. They will reset in <Text fontSize="$4">1 day</Text>
      </Text>
    </View>
  )
}
