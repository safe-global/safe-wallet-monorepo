import React from 'react'
import { H6, Text, View } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

interface PositionsErrorProps {
  onRetry: () => void
}

export const PositionsError = ({ onRetry }: PositionsErrorProps) => {
  return (
    <View testID="positions-error" alignItems="center" gap="$4" marginTop="$4">
      <H6 fontWeight={600}>Couldn't load positions</H6>
      <Text textAlign="center" color="$colorSecondary" width="80%">
        Something went wrong. Please try to load the page again.
      </Text>
      <SafeButton backgroundColor="$backgroundSecondary" color="$colorPrimary" onPress={onRetry}>
        <SafeFontIcon size={16} name="update" color="$colorPrimary" />
        Retry
      </SafeButton>
    </View>
  )
}
