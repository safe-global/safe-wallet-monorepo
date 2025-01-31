import React from 'react'
import { ScrollView } from 'react-native'
import { Button, View, YStack } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import { SectionTitle } from '@/src/components/Title'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SafeButton } from '@/src/components/SafeButton'

import { SafeInput } from '@/src/components/SafeInput'
import { useImportPrivateKey } from './hooks/useImportPrivateKey'

export function ImportPrivateKey() {
  const { handlePrivateKeyChange, handleImport, onPrivateKeyPaste, wallet, privateKey, error } = useImportPrivateKey()
  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>Import a private key</NavBarTitle>,
  })

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <View flex={1}>
        <ScrollView onScroll={handleScroll}>
          <View marginTop="$2">
            <SectionTitle
              title="Import a private key"
              description="Enter your seed phrase or a private key below. Make sure to do so in a safe and private place."
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
          <SafeButton onPress={handleImport} label="Import signer" />
        </View>
      </View>
    </SafeAreaView>
  )
}
