import React from 'react'
import { Text, YStack, H2, XStack, ScrollView } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { KeyboardAvoidingView } from 'react-native'
import { Alert } from '@/src/components/Alert'
import { SafeInput } from '@/src/components/SafeInput'

interface EnterPasswordViewProps {
  topInset: number
  bottomInset: number
  password: string
  isLoading: boolean
  fileName?: string
  onPasswordChange: (password: string) => void
  onDecrypt: () => void
}

export const EnterPasswordView = ({
  topInset,
  bottomInset,
  password,
  isLoading,
  fileName,
  onPasswordChange,
  onDecrypt,
}: EnterPasswordViewProps) => {
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }} keyboardVerticalOffset={bottomInset + topInset}>
      <ScrollView contentContainerStyle={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <YStack flex={1} testID="enter-password-screen">
          <YStack flex={1} paddingHorizontal="$4" justifyContent="space-between" marginTop={'$4'}>
            <YStack gap="$6">
              <H2 fontWeight={'600'} textAlign="center" marginHorizontal={'$4'}>
                Enter password
              </H2>

              <XStack justifyContent="center">
                <Alert type="warning" message="Use the password you set to encrypt the file." orientation="left" />
              </XStack>

              <YStack gap="$4">
                <SafeInput
                  placeholder="Enter the file password"
                  keyboardType="visible-password"
                  value={password}
                  onChangeText={onPasswordChange}
                  autoFocus
                  secureTextEntry
                  testID="password-input"
                />

                <YStack>
                  {fileName && (
                    <Text color="$colorSecondary" fontSize="$3" testID="file-name">
                      File: {fileName}
                    </Text>
                  )}
                </YStack>
              </YStack>
            </YStack>

            <YStack gap="$4" paddingBottom={bottomInset}>
              <SafeButton
                primary
                testID="decrypt-button"
                onPress={onDecrypt}
                disabled={!password.length || isLoading}
                opacity={!password.length || isLoading ? 0.5 : 1}
              >
                {isLoading ? 'Decrypting...' : 'Continue'}
              </SafeButton>
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
