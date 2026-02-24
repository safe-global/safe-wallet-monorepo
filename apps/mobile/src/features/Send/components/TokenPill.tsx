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
    <View flexDirection="row" alignItems="center" gap="$3" marginTop="$4">
      <View
        flexDirection="row"
        alignItems="center"
        gap="$2"
        backgroundColor="$backgroundSkeleton"
        borderRadius={24}
        paddingHorizontal="$3"
        paddingVertical="$2"
      >
        {logoUri && (
          <Image
            source={{ uri: logoUri }}
            style={{ width: 28, height: 28, borderRadius: 14 }}
            cachePolicy="memory-disk"
          />
        )}
        <Text fontSize="$4" fontWeight={600} color="$color">
          {balance ? `${balance} ${symbol}` : symbol}
        </Text>
      </View>
      <Pressable onPress={onMaxPress} testID="max-button">
        <Text fontSize="$4" fontWeight={600} color="$primary">
          MAX
        </Text>
      </Pressable>
    </View>
  )
}
