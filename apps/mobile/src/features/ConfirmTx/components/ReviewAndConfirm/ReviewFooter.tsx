import React from 'react'
import { Stack } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { SelectSigner } from '@/src/components/SelectSigner'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Address } from '@/src/types/address'
import type { Signer } from '@/src/store/signersSlice'

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
    <Stack
      backgroundColor="$background"
      paddingHorizontal="$4"
      paddingVertical="$3"
      borderTopWidth={1}
      borderTopColor="$borderLight"
      space="$3"
      paddingBottom={insets.bottom ? insets.bottom : '$4'}
    >
      <SelectSigner address={activeSigner?.value as Address} txId={txId} disabled={buttonDisabled} />

      <SafeButton onPress={onConfirmPress} disabled={buttonDisabled} loading={isSigningLoading} height={44}>
        {buttonText}
      </SafeButton>
    </Stack>
  )
}
