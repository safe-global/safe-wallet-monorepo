import React from 'react'
import { Pressable } from 'react-native'
import { Text, View } from 'tamagui'
import { Image } from 'expo-image'

interface TokenPillProps {
  symbol: string
  logoUri?: string | null
  onMaxPress: () => void
}

export function TokenPill({ symbol, logoUri, onMaxPress }: TokenPillProps) {
  return (
    <View flexDirection="row" alignItems="center" gap="$2">
      <View
        flexDirection="row"
        alignItems="center"
        gap="$2"
        backgroundColor="$backgroundSkeleton"
        borderRadius={20}
        paddingHorizontal="$3"
        paddingVertical="$2"
      >
        {logoUri && (
          <Image
            source={{ uri: logoUri }}
            style={{ width: 20, height: 20, borderRadius: 10 }}
            cachePolicy="memory-disk"
          />
        )}
        <Text fontSize="$3" fontWeight={600}>
          {symbol}
        </Text>
      </View>
      <Pressable onPress={onMaxPress} testID="max-button">
        <View backgroundColor="$primaryLight" borderRadius={12} paddingHorizontal="$2" paddingVertical="$1">
          <Text fontSize="$2" fontWeight={600} color="$primary">
            MAX
          </Text>
        </View>
      </Pressable>
    </View>
  )
}
