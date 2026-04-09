import React from 'react'
import { View } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { SelectSigner } from '@/src/components/SelectSigner'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Address } from '@/src/types/address'
import type { Signer } from '@/src/store/signersSlice'
import { WalletConnectGate } from '@/src/features/WalletConnect/components/WalletConnectGate'

interface ReviewFooterProps {
  txId: string
  activeSigner: Signer | null | undefined
  isSigningLoading: boolean
  onConfirmPress: () => void
}

export function ReviewFooter({ txId, activeSigner, isSigningLoading, onConfirmPress }: ReviewFooterProps) {
  const insets = useSafeAreaInsets()

  const buttonText = isSigningLoading ? 'Validating' : 'Confirm transaction'
  const buttonDisabled = isSigningLoading

  return (
    <View
      backgroundColor="$background"
      paddingHorizontal="$4"
      paddingVertical="$3"
      borderTopWidth={1}
      borderTopColor="$borderLight"
      gap="$3"
      paddingBottom={insets.bottom ? insets.bottom : '$4'}
    >
      <SelectSigner address={activeSigner?.value as Address} txId={txId} disabled={buttonDisabled} />

      <WalletConnectGate signerAddress={activeSigner?.value || ''}>
        <SafeButton onPress={onConfirmPress} disabled={buttonDisabled} loading={isSigningLoading}>
          {buttonText}
        </SafeButton>
      </WalletConnectGate>
    </View>
  )
}
