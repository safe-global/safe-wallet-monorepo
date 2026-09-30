import React from 'react'
import { Text, YStack } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'

// Center-of-lens error state shared by the QR scanners: a message plus a Try again button that
// resets the scanner back to scanning. Render it as QrCamera's `centerOverlay`.
export function ScanErrorOverlay({
  message,
  onTryAgain,
  testID,
}: {
  message: string
  onTryAgain: () => void
  testID?: string
}) {
  return (
    <YStack alignItems="center" gap="$3" paddingHorizontal="$3">
      <Text color="$error" textAlign="center" fontWeight="600">
        {message}
      </Text>
      <SafeButton rounded secondary onPress={onTryAgain} testID={testID}>
        Try again
      </SafeButton>
    </YStack>
  )
}
