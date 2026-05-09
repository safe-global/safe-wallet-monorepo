import React from 'react'
import { Text, YStack } from 'tamagui'

export function CanNotExecute() {
  return (
    <YStack gap="$4" padding="$8" alignItems="center" justifyContent="center" testID="can-not-sign-container">
      <Text fontSize="$4" fontWeight={400} width="100%" textAlign="center" color="$textSecondaryLight">
        Only signers of this Safe can execute this transaction
      </Text>
    </YStack>
  )
}
