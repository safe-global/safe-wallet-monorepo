import React from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { View, Text, Button } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import Clipboard from '@react-native-clipboard/clipboard'

import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { LargeHeaderTitle } from '@/src/components/Title'
import { SignersCard } from '@/src/components/transactions-list/Card/SignersCard'
import { ToastViewport } from '@tamagui/toast'

export default function LedgerSuccessPage() {
  const { bottom } = useSafeAreaInsets()
  const params = useLocalSearchParams<{
    address: string
    name: string
    path: string
  }>()
  const toast = useToastController()

  const handleContinue = () => {
    // Navigate back to the main signers screen
    router.dismissAll()
    router.navigate('/(tabs)/signers')
  }

  const handleCopyAddress = () => {
    if (params.address) {
      Clipboard.setString(params.address)
      toast.show('Address copied to clipboard', {
        native: false,
        duration: 2000,
      })
    }
  }

  return (
    <View flex={1} justifyContent="space-between" testID="ledger-import-success">
      <View flex={1}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View flex={1} flexGrow={1} alignItems="center" justifyContent="center" paddingHorizontal="$3">
            <Badge
              circleProps={{ backgroundColor: '$backgroundLightLight' }}
              themeName="badge_success"
              circleSize={64}
              content={<SafeFontIcon size={32} color="$success" name="check-filled" />}
            />

            <View margin="$10" width="100%" alignItems="center" gap="$4">
              <LargeHeaderTitle textAlign="center">Ledger signer imported!</LargeHeaderTitle>

              <Text textAlign="center" fontSize="$4">
                Your Ledger hardware signer is now ready to use. You can sign and execute transactions with your
                hardware device.
              </Text>
            </View>

            <SignersCard
              transparent={false}
              rightNode={
                <View flex={1} alignItems="flex-end">
                  <Button
                    maxWidth={120}
                    height="$10"
                    paddingHorizontal="$2"
                    borderRadius="$3"
                    backgroundColor="$borderLight"
                    fontWeight="500"
                    size="$5"
                    onPress={handleCopyAddress}
                    icon={<SafeFontIcon name="copy" />}
                  >
                    Copy
                  </Button>
                </View>
              }
              name={params.name || 'Ledger Signer'}
              address={params.address || ''}
            />

            {params.path && (
              <View
                marginTop="$4"
                paddingHorizontal="$4"
                paddingVertical="$3"
                backgroundColor="$backgroundSecondary"
                borderRadius="$3"
                width="100%"
              >
                <Text fontSize="$3" color="$colorSecondary" textAlign="center">
                  Derivation Path: {params.path}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        <ToastViewport multipleToasts={false} left={0} right={0} />
      </View>

      <View paddingHorizontal="$3" paddingBottom={bottom}>
        <SafeButton onPress={handleContinue} testID="ledger-success-continue">
          Continue
        </SafeButton>
      </View>
    </View>
  )
}
