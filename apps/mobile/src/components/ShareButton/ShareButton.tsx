import React from 'react'
import { View } from 'tamagui'
import { Pressable } from 'react-native'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

interface ShareButtonProps {
  onPress: () => void
  testID?: string
}

export function ShareButton({ onPress, testID }: ShareButtonProps) {
  return (
    <Pressable hitSlop={10} onPress={onPress} testID={testID}>
      <View
        backgroundColor="$backgroundSkeleton"
        alignItems="center"
        justifyContent="center"
        borderRadius={16}
        height={32}
        width={32}
      >
        <SafeFontIcon name="export" size={16} color="$color" />
      </View>
    </Pressable>
  )
}
