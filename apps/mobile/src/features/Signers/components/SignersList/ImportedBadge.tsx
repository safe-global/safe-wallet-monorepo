import React from 'react'
import { Text, View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

export function ImportedBadge() {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap="$1"
      backgroundColor="$backgroundSuccess"
      paddingHorizontal="$2"
      paddingVertical={2}
      borderRadius={100}
      testID="imported-badge"
    >
      <SafeFontIcon name="check-filled" size={12} color="$success" />
      <Text fontSize="$4" color="$success" lineHeight={20}>
        Imported
      </Text>
    </View>
  )
}
