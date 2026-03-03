import React from 'react'
import { Text, View } from 'tamagui'
import { shortenAddress } from '@/src/utils/formatters'

interface RecipientDisplayProps {
  address: string
  name?: string
}

export function RecipientDisplay({ name, address }: RecipientDisplayProps) {
  if (name) {
    return (
      <View gap={2}>
        <Text fontSize="$4" fontWeight={600} color="$color">
          {name}
        </Text>
        <Text fontSize="$3" color="$colorSecondary">
          {shortenAddress(address, 4)}
        </Text>
      </View>
    )
  }

  return (
    <Text fontSize="$4" color="$color">
      {shortenAddress(address, 6)}
    </Text>
  )
}
