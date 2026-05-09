import { Text, View } from 'tamagui'
import { BlockaidMessage } from '@/src/features/TransactionChecks/components/blockaid/scans/BlockaidMessage'
import React from 'react'

export const BlockaidError = () => {
  return (
    <View backgroundColor="$backgroundSecondary" padding="$3" borderRadius="$2">
      <Text fontWeight="700" fontSize={16} marginBottom="$2">
        Proceed with caution
      </Text>
      <Text fontSize={14}>
        The transaction could not be checked for security alerts. Verify the details and addresses before proceeding.
      </Text>
      <BlockaidMessage />
    </View>
  )
}
