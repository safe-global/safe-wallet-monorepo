import React from 'react'
import { Text, YStack } from 'tamagui'

export function ReviewHeader() {
  return (
    <YStack space="$4" paddingTop="$4">
      <YStack space="$2">
        <Text color="$colorSecondary">
          Review this transaction data and make sure it matches with the details on the web app.
        </Text>
      </YStack>
    </YStack>
  )
}
