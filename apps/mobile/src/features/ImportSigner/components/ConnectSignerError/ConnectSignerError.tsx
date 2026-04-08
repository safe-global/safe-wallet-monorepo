import React from 'react'
import { ScrollView } from 'react-native'
import { Text, View, useTheme } from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeButton } from '@/src/components/SafeButton/SafeButton'
import { AbsoluteLinearGradient } from '@/src/components/LinearGradient'
import { WalletConnectBadge } from '@/src/features/WalletConnect/components/WalletConnectBadge'
import Logger from '@/src/utils/logger'
import { useAppSelector } from '@/src/store/hooks'
import { selectPendingSafe } from '@/src/store/signerImportFlowSlice'

export function ConnectSignerError() {
  const { address, walletIcon } = useLocalSearchParams<{ address: string; walletIcon: string }>()
  const router = useRouter()
  const theme = useTheme()
  const pendingSafe = useAppSelector(selectPendingSafe)

  const handleDonePress = async () => {
    try {
      router.dismissAll()
      if (pendingSafe) {
        router.dismissTo({
          pathname: '/(import-accounts)/signers',
          params: {
            safeAddress: pendingSafe.address,
            safeName: pendingSafe.name,
          },
        })
      } else {
        router.dismissTo('/signers')
      }
    } catch (error) {
      Logger.error('Navigation error:', error)
    }
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
        <SafeButton onPress={handleDonePress} testID="connect-signer-error-done">
          Done
        </SafeButton>
      </View>
    </View>
  )
}
