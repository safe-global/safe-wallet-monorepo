import React from 'react'
import { Text, YStack } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function AlreadySigned() {
  const insets = useSafeAreaInsets()

  return (
    <YStack paddingBottom={insets.bottom ? insets.bottom : '$4'}>
      <Text fontSize="$4" fontWeight={400} textAlign="center" color="$textSecondaryLight" marginBottom="$2">
        Can be executed once the threshold is reached.
      </Text>
    </YStack>
  )
}
