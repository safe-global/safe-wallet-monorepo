import React from 'react'
import { Stack } from 'tamagui'
import { router } from 'expo-router'
import { SafeButton } from '@/src/components/SafeButton'
import { SelectSigner } from '@/src/components/SelectSigner'
import { useBiometrics } from '@/src/hooks/useBiometrics'
import { useGuard } from '@/src/context/GuardProvider'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTransactionSigner } from '@/src/features/ConfirmTx/hooks/useTransactionSigner'
import { Address } from '@/src/types/address'

interface ReviewFooterProps {
  txId: string
}

export function ReviewFooter({ txId }: ReviewFooterProps) {
  const { signerState } = useTransactionSigner(txId)
  const { activeSigner } = signerState
  const { isBiometricsEnabled } = useBiometrics()
  const { setGuard } = useGuard()
  const insets = useSafeAreaInsets()
  const handleConfirmPress = async () => {
    try {
      setGuard('signing', true)

      const params = { txId }

      if (isBiometricsEnabled) {
        router.push({
          pathname: '/sign-transaction',
          params,
        })
      } else {
        router.push({
          pathname: '/biometrics-opt-in',
          params: { ...params, caller: '/sign-transaction' },
        })
      }
    } catch (error) {
      console.error('Error confirming transaction:', error)
    }
  }

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
      <SelectSigner address={activeSigner?.value as Address} txId={txId} />

      <SafeButton onPress={handleConfirmPress} width="100%">
        Confirm transaction
      </SafeButton>
    </Stack>
  )
}
