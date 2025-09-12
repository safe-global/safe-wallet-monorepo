import { Text, XStack, YStack } from 'tamagui'
import { Loader } from '@/src/components/Loader'
import React from 'react'

export const PendingTx = () => {
  return (
    <YStack gap="$4" padding="$8" alignItems="center" justifyContent="center" testID="can-not-sign-container">
      <XStack gap="$1" alignItems="center" justifyContent="center">
        <Loader size={24} thickness={2} color="#12FF80" />
        <Text>Loading</Text>
      </XStack>
    </YStack>
  )
}
