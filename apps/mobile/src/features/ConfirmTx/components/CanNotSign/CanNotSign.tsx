import React from 'react'
import { Text, YStack } from 'tamagui'

export function CanNotSign() {
  return (
    <YStack gap="$4" padding="$2" alignItems="center" justifyContent="center" testID="can-not-sign-container">
      <Text fontSize="$4" fontWeight={400} width="70%" textAlign="center" color="$textSecondaryLight">
        Only signers of this safe can sign this transaction
      </Text>
    </YStack>
  )
}
