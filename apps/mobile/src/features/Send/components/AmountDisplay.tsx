import React from 'react'
import { Pressable } from 'react-native'
import { Text, View } from 'tamagui'

interface AmountDisplayProps {
  primaryDisplay: string
  secondaryDisplay: string
  onToggle: () => void
  canToggle: boolean
}

export function AmountDisplay({ primaryDisplay, secondaryDisplay, onToggle, canToggle }: AmountDisplayProps) {
  return (
    <Pressable onPress={canToggle ? onToggle : undefined}>
      <View alignItems="center" gap="$2" paddingVertical="$4">
        <Text fontSize={36} fontWeight={700} color="$color" testID="primary-amount">
          {primaryDisplay || '0'}
        </Text>
        {secondaryDisplay ? (
          <Text fontSize="$4" color="$colorSecondary" testID="secondary-amount">
            {secondaryDisplay}
          </Text>
        ) : null}
      </View>
    </Pressable>
  )
}
