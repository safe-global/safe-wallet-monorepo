import React from 'react'
import { Button, YStack, Text } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { ActivityIndicator } from 'react-native'

interface CreatePasskeyProps {
  onPress: () => void
  isLoading: boolean
}

export function CreatePasskey({ onPress, isLoading }: CreatePasskeyProps) {
  return (
    <YStack gap="$3" alignItems="center" padding="$4">
      <SafeFontIcon name="fingerprint" size={32} color="$primary" />
      <Text color="$colorSecondary" textAlign="center">
        Create a passkey to sign transactions with biometrics
      </Text>
      <Button
        onPress={onPress}
        disabled={isLoading}
        backgroundColor="$primary"
        borderRadius="$3"
        width="100%"
        height={50}
        icon={isLoading ? <ActivityIndicator color="white" /> : undefined}
      >
        <Text color="white" fontWeight={600}>
          {isLoading ? 'Creating...' : 'Create passkey'}
        </Text>
      </Button>
    </YStack>
  )
}
