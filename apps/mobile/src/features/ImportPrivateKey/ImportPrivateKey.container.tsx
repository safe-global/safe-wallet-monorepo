import React from 'react'
import { KeyboardAvoidingView, StyleSheet } from 'react-native'
import { Button, getTokenValue, View, YStack, ScrollView } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import { SectionTitle } from '@/src/components/Title'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SafeButton } from '@/src/components/SafeButton'

import { SafeInput } from '@/src/components/SafeInput'
import { useImportPrivateKey } from './hooks/useImportPrivateKey'

export function ImportPrivateKey() {
  const insets = useSafeAreaInsets()
  const { handlePrivateKeyChange, handleImport, onPrivateKeyPaste, wallet, privateKey, error } = useImportPrivateKey()
  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>Import a private key</NavBarTitle>,
  })

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.flex1}
      keyboardVerticalOffset={insets.bottom + insets.top + getTokenValue('$4')}
    >
      <ScrollView onScroll={handleScroll} flex={1}>
        <View marginTop="$2">
          <SectionTitle
            title="Import a private key"
            description="Enter your private key below. Make sure to do so in a safe and private place."
          />
        </View>

        <YStack marginHorizontal="$3" gap="$4" marginTop="$6" paddingVertical="$1" paddingHorizontal="$1">
          <View>
            <SafeInput
              height={114}
              value={privateKey}
              onChangeText={handlePrivateKeyChange}
              placeholder="Paste here or type..."
              multiline
              success={!!wallet}
              textAlign="center"
              error={error}
            />
          </View>

          <View alignItems="center">
            <Button
              height="$10"
              paddingHorizontal="$2"
              borderRadius="$3"
              backgroundColor="$borderLight"
              icon={<SafeFontIcon name="paste" />}
              fontWeight="500"
              size="$5"
              onPress={onPrivateKeyPaste}
            >
              Paste
            </Button>
          </View>
        </YStack>
      </ScrollView>

      <View paddingHorizontal={'$3'}>
        <SafeButton onPress={handleImport} testID={'import-signer-button'}>
          Import signer
        </SafeButton>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
})
