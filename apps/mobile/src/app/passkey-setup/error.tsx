import React from 'react'
import { Text, YStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePasskeySetup } from '@/src/features/PasskeySetup/context/PasskeySetupProvider'

export default function PasskeyErrorScreen() {
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()
  const { error } = usePasskeySetup()

  const handleRetry = () => {
    // Replace back to creating screen (credential preserved in context)
    router.replace('/passkey-setup/creating')
  }

  const handleCancel = () => {
    router.dismissAll()
  }

  return (
    <YStack
      flex={1}
      paddingHorizontal="$4"
      paddingBottom={Math.max(bottom, 16)}
      justifyContent="center"
      alignItems="center"
      gap="$4"
    >
      <SafeFontIcon name="fingerprint" size={48} color="$error" />
      <Text fontSize="$6" fontWeight={700} textAlign="center">
        Something went wrong
      </Text>
      <Text fontSize="$4" color="$colorSecondary" textAlign="center">
        {error || 'Failed to create your passkey. Please try again.'}
      </Text>

      <YStack width="100%" gap="$3" paddingTop="$4">
        <SafeButton onPress={handleRetry}>Try again</SafeButton>
        <SafeButton secondary onPress={handleCancel}>
          Cancel
        </SafeButton>
      </YStack>
    </YStack>
  )
}
