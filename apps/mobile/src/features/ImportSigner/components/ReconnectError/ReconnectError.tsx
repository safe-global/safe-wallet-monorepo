import React from 'react'
import { ScrollView } from 'react-native'
import { Text, View, useTheme } from 'tamagui'
import { router, useLocalSearchParams } from 'expo-router'
import { Badge } from '@/src/components/Badge/Badge'
import { SafeButton } from '@/src/components/SafeButton/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { AbsoluteLinearGradient } from '@/src/components/LinearGradient'
import { useWalletConnectContext } from '@/src/features/WalletConnect/context/WalletConnectContext'

export function ReconnectError() {
  const { address: expectedAddress } = useLocalSearchParams<{ address: string }>()
  const theme = useTheme()
  const { reconnect } = useWalletConnectContext()

  const handleRetryPress = () => {
    router.dismiss()
    reconnect(expectedAddress)
  }

  return (
    <View flex={1} justifyContent="space-between" testID="reconnect-error">
      <AbsoluteLinearGradient colors={[theme.error.get(), 'transparent']} />

      <View flex={1}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View flex={1} flexGrow={1} alignItems="center" justifyContent="center" paddingHorizontal="$4">
            <View alignItems="center" gap="$5">
              <Badge
                themeName="badge_error"
                circleSize={64}
                content={<SafeFontIcon size={32} color="$error" name="close-filled" />}
              />

              <View width="100%" alignItems="center">
                <Text fontWeight="700" fontSize={24} lineHeight={32} textAlign="center" color="$color">
                  Wrong wallet connected
                </Text>
                <Text textAlign="center" fontSize="$4" color="$colorSecondary" lineHeight={20}>
                  This wallet doesn't match the expected signer address. Please connect a different wallet.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      <View paddingHorizontal="$4">
        <SafeButton onPress={handleRetryPress} testID="reconnect-error-done">
          Connect a different wallet
        </SafeButton>
      </View>
    </View>
  )
}
