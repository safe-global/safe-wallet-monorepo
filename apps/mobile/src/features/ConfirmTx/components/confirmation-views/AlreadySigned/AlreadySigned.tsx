import { SafeButton } from '@/src/components/SafeButton'
import React from 'react'
import { Text, View, YStack } from 'tamagui'

export function AlreadySigned() {
  return (
    <YStack justifyContent="center" gap="$4" alignItems="center" paddingHorizontal={'$4'}>
      <Text fontSize="$4" fontWeight={400} textAlign="center" color="$textSecondaryLight">
        You have already signed this transaction.
      </Text>

      <View height={50} width="100%">
        <SafeButton height="100%" rounded fullscreen fontWeight={600} disabled>
          Confirm
        </SafeButton>
      </View>
    </YStack>
  )
}
