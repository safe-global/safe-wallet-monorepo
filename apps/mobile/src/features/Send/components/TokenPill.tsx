import React from 'react'
import { Pressable } from 'react-native'
import { Text, View } from 'tamagui'
import { Image } from 'expo-image'

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
      {logoUri && (
        <Image
          source={{ uri: logoUri }}
          style={{ width: 28, height: 28, borderRadius: 14 }}
          cachePolicy="memory-disk"
        />
      )}
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
