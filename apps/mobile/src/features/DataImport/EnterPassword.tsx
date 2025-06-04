import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { Text, YStack, H2, XStack, ScrollView } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme, KeyboardAvoidingView } from 'react-native'
import { useDataImportContext } from './DataImportProvider'
import { Alert } from '@/src/components/Alert'
import { SafeInput } from '@/src/components/SafeInput'

export const EnterPassword = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const { handlePasswordChange, handleImport, password, isLoading, fileName } = useDataImportContext()

  const handleDecrypt = useCallback(async () => {
    const result = await handleImport()
    if (result) {
      // Navigate to review data screen to show what will be imported
      router.push('/import-data/review-data')
    } else {
      // Navigate to error screen when import fails
      router.push('/import-data/import-error')
    }
  }, [handleImport, router])

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }} keyboardVerticalOffset={insets.bottom + insets.top}>
      <ScrollView contentContainerStyle={{ flex: 1 }}>
        <YStack flex={1} testID="enter-password-screen">
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

          {/* Content */}
          <YStack flex={1} paddingHorizontal="$4" justifyContent="space-between" marginTop={'$4'}>
            <YStack gap="$6">
              {/* Title */}
              <H2 fontWeight={'600'} textAlign="center" marginHorizontal={'$4'}>
                Enter password
              </H2>

              {/* Warning Box */}
              <XStack justifyContent="center">
                <Alert
                  type="warning"
                  message="Make sure to enter the password you used to encrypt the file in the old app."
                  orientation="left"
                />
              </XStack>

              <YStack gap="$4" marginTop="$8">
                {/* Hidden Text Input */}
                <SafeInput
                  placeholder="Enter the file password"
                  keyboardType="visible-password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  autoFocus
                  secureTextEntry
                  testID="password-input"
                />

                <YStack>
                  {/* File Info */}
                  {fileName && (
                    <Text color="$colorSecondary" fontSize="$3" testID="file-name">
                      File: {fileName}
                    </Text>
                  )}
                </YStack>
              </YStack>
            </YStack>

            {/* Bottom Actions */}
            <YStack gap="$4" paddingBottom={insets.bottom}>
              <SafeButton
                primary
                testID="decrypt-button"
                onPress={handleDecrypt}
                disabled={!password.length || isLoading}
                opacity={!password.length || isLoading ? 0.5 : 1}
              >
                {isLoading ? 'Decrypting...' : 'Decrypt'}
              </SafeButton>
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
