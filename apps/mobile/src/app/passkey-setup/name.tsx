import React, { useState } from 'react'
import { Text, YStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePasskeySetup } from '@/src/features/PasskeySetup/context/PasskeySetupProvider'
import { Container } from '@/src/components/Container'
import { TextInput, TouchableOpacity } from 'react-native'
import { useTheme } from '@/src/theme/hooks/useTheme'

export default function PasskeyNameScreen() {
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()
  const { name: contextName, setName } = usePasskeySetup()
  const [localName, setLocalName] = useState(contextName)
  const { isDark } = useTheme()

  const handleContinue = () => {
    setName(localName.trim() || 'My iPhone Passkey')
    // Point of no return — credential already created
    router.replace('/passkey-setup/creating')
  }

  const handleClear = () => {
    setLocalName('')
  }

  return (
    <YStack flex={1} paddingHorizontal="$4" paddingBottom={Math.max(bottom, 16)}>
      <YStack flex={1} gap="$4">
        <Text fontSize="$7" fontWeight={700}>
          Name your passkey
        </Text>
        <Text fontSize="$4" color="$colorSecondary">
          This passkey will appear in your Safe as a signer.
        </Text>

        <Container flexDirection="row" alignItems="center" gap="$3" padding="$4" marginTop="$2">
          <SafeFontIcon name="fingerprint" size={20} color="$primary" />
          <TextInput
            value={localName}
            onChangeText={setLocalName}
            placeholder="My iPhone Passkey"
            placeholderTextColor={isDark ? '#666' : '#999'}
            style={{
              flex: 1,
              fontSize: 16,
              color: isDark ? '#fff' : '#000',
            }}
            autoFocus
          />
          {localName.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <SafeFontIcon name="close" size={16} color="$colorSecondary" />
            </TouchableOpacity>
          )}
        </Container>
        <Text fontSize="$2" color="$colorSecondary" paddingHorizontal="$1">
          Only visible to you.
        </Text>
      </YStack>

      <SafeButton onPress={handleContinue}>Continue</SafeButton>
    </YStack>
  )
}
