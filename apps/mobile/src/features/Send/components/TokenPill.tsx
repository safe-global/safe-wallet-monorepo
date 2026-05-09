import React from 'react'
import { Pressable } from 'react-native'
import { Text, View } from 'tamagui'
import { TokenIcon } from '@/src/components/TokenIcon/TokenIcon'

interface TokenPillProps {
  symbol: string
  logoUri?: string | null
  balance?: string
  onMaxPress: () => void
}

export function TokenPill({ symbol, logoUri, balance, onMaxPress }: TokenPillProps) {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      backgroundColor="$backgroundSkeleton"
      borderRadius={199}
      paddingLeft={4}
      paddingRight={12}
      height={48}
      gap="$3"
    >
      <TokenIcon logoUri={logoUri} size="$7" />
      <Text fontSize={16} color="$color">
        {balance ? `${balance} ${symbol}` : symbol}
      </Text>
      <Pressable onPress={onMaxPress} testID="max-button">
        <Text fontSize={16} color="$primary">
          MAX
        </Text>
      </Pressable>
    </View>
  )
}
