import React from 'react'
import { ScrollView } from 'react-native'
import { Text, View, useTheme } from 'tamagui'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeButton } from '@/src/components/SafeButton/SafeButton'
import { AbsoluteLinearGradient } from '@/src/components/LinearGradient'
import { WalletConnectBadge } from '@/src/features/WalletConnect/components/WalletConnectBadge'
import { useWalletConnectContext } from '@/src/features/WalletConnect/context/WalletConnectContext'

export function ConnectSignerError() {
  const { address, walletIcon } = useLocalSearchParams<{ address: string; walletIcon: string }>()
  const theme = useTheme()
  const { initiateConnection } = useWalletConnectContext()

  const handleTryAgainPress = async () => {
    router.dismiss()
    initiateConnection()
  }

  return (
    <View flex={1} justifyContent="space-between" testID="connect-signer-error">
      <AbsoluteLinearGradient colors={[theme.error.get(), 'transparent']} />

      <View flex={1}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View flex={1} flexGrow={1} alignItems="center" justifyContent="center" paddingHorizontal="$4">
            <View alignItems="center" gap="$5">
              <WalletConnectBadge
                address={address}
                walletIcon={walletIcon}
                size={64}
                statusSize={24}
                iconSize={40}
                testID="wc-badge-error"
                status="error"
              />

              <View width="100%" alignItems="center">
                <Text fontWeight="700" fontSize={24} lineHeight={32} textAlign="center" color="$color">
                  Can't sign with this wallet
                </Text>
                <Text textAlign="center" fontSize="$4" color="$colorSecondary" lineHeight={20}>
                  This wallet isn't a signer on this Safe.
                </Text>
                <Text textAlign="center" fontSize="$4" color="$colorSecondary" lineHeight={20}>
                  Connect a different wallet.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      <View paddingHorizontal="$4">
        <SafeButton onPress={handleTryAgainPress} testID="connect-signer-error-done">
          Connect a different wallet
        </SafeButton>
      </View>
    </View>
  )
}
