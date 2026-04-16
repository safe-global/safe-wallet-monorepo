import React from 'react'
import { Text, View, YStack } from 'tamagui'
import { usePasskeySigner } from './hooks/usePasskeySigner'
import { CreatePasskey } from './components/CreatePasskey'
import { PasskeyInfo } from './components/PasskeyInfo'

export function PasskeySignerContainer() {
  const { passkeyMetadata, isLoading, error, create, remove } = usePasskeySigner()

  return (
    <View backgroundColor="$backgroundDark" padding="$4" borderRadius="$3" gap="$2">
      <Text color="$colorSecondary" fontWeight={500}>
        Passkey
      </Text>
      <View backgroundColor="$background" borderRadius="$3">
        {passkeyMetadata ? (
          <PasskeyInfo metadata={passkeyMetadata} onRemove={remove} isLoading={isLoading} />
        ) : (
          <CreatePasskey onPress={create} isLoading={isLoading} />
        )}

        {error && (
          <YStack padding="$3">
            <Text color="$error" fontSize="$2">
              {error}
            </Text>
          </YStack>
        )}
      </View>
    </View>
  )
}
