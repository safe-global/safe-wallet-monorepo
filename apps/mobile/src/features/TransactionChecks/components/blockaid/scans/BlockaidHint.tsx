import React from 'react'
import { YStack, Text } from 'tamagui'

export const BlockaidHint = ({ warnings }: { warnings: string[] }) => {
  return (
    <YStack gap="$1">
      {warnings.map((warning, index) => (
        <Text key={index} fontSize={'$3'} fontFamily={'$body'}>
          • {warning}
        </Text>
      ))}
    </YStack>
  )
}
