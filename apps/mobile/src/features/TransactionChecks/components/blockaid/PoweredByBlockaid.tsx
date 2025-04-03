import React from 'react'
import { XStack, Text } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

export const PoweredByBlockaid = () => (
  <XStack gap="$1" alignItems="center" marginTop="$2">
    <Text fontSize={12} color="$colorSecondary">
      Powered by
    </Text>
    <SafeFontIcon name="shield" size={14} color="$colorSecondary" />
    <Text fontSize={12} color="$colorSecondary">
      Blockaid
    </Text>
  </XStack>
)
