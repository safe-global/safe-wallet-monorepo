import React from 'react'
import { Text, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { TokenIcon } from '@/src/components/TokenIcon'
import { ellipsis } from '@/src/utils/formatters'

interface AssetsCardProps {
  name: string
  description: string
  logoUri?: string | null
  rightNode?: string | React.ReactNode
  accessibilityLabel?: string
  imageBackground?: string
  transparent?: boolean
  onPress?: () => void
}

export function AssetsCard({
  name,
  description,
  imageBackground,
  logoUri,
  accessibilityLabel,
  rightNode,
  transparent = true,
  onPress,
}: AssetsCardProps) {
  return (
    <SafeListItem
      onPress={onPress}
      label={
        <View>
          <Text fontSize="$4" fontWeight={600}>
            {name}
          </Text>
          <Text fontSize="$4" color="$colorSecondary" fontWeight={400}>
            {description}
          </Text>
        </View>
      }
      transparent={transparent}
      leftNode={
        <TokenIcon imageBackground={imageBackground} logoUri={logoUri} accessibilityLabel={accessibilityLabel} />
      }
      rightNode={
        typeof rightNode === 'string' ? (
          <Text fontSize="$4" fontWeight={400} color="$color">
            {ellipsis(rightNode, 10)}
          </Text>
        ) : (
          rightNode
        )
      }
    />
  )
}
