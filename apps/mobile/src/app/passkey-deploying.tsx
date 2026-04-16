import React from 'react'
import { ActivityIndicator } from 'react-native'
import { Text, View, YStack } from 'tamagui'
import { useLocalSearchParams } from 'expo-router'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

export default function PasskeyDeployingScreen() {
  const { chainName, status } = useLocalSearchParams<{ chainName?: string; status?: string }>()

  const isError = status === 'error'

  return (
    <View flex={1} justifyContent="center" alignItems="center" padding="$6">
      <YStack alignItems="center" gap="$4">
        <SafeFontIcon name="fingerprint" size={48} color={isError ? '$error' : '$primary'} />

        {isError ? (
          <>
            <Text fontSize="$5" fontWeight={600} textAlign="center">
              Deployment failed
            </Text>
            <Text color="$colorSecondary" textAlign="center">
              Failed to deploy identity contract{chainName ? ` on ${chainName}` : ''}. Please try again.
            </Text>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" />
            <Text fontSize="$5" fontWeight={600} textAlign="center">
              Deploying identity contract...
            </Text>
            <Text color="$colorSecondary" textAlign="center">
              {chainName ? `Deploying on ${chainName}. ` : ''}This may take a moment.
            </Text>
          </>
        )}
      </YStack>
    </View>
  )
}
