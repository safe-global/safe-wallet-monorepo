import React from 'react'
import { Stack } from 'tamagui'
import { router } from 'expo-router'
import { SafeButton } from '@/src/components/SafeButton'
import { useBiometrics } from '@/src/hooks/useBiometrics'
import { useGuard } from '@/src/context/GuardProvider'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTransactionSigner } from '@/src/features/ConfirmTx/hooks/useTransactionSigner'
import { Address } from '@/src/types/address'
import { SelectExecutor } from '@/src/components/SelectExecutor'

interface ReviewFooterProps {
  txId: string
}

export function ReviewExecuteFooter({ txId }: ReviewFooterProps) {
  const { signerState } = useTransactionSigner(txId)
  const { activeSigner } = signerState
  const { isBiometricsEnabled } = useBiometrics()
  const { setGuard } = useGuard()
  const insets = useSafeAreaInsets()

  const handleConfirmPress = async () => {
    try {
      setGuard('executing', true)

      const params = { txId }

      if (isBiometricsEnabled) {
        router.push({
          pathname: '/execute-transaction',
          params,
        })
      } else {
        router.push({
          pathname: '/biometrics-opt-in',
          params: { ...params, caller: '/execute-transaction' },
        })
      }
    } catch (error) {
      console.error('Error executing transaction:', error)
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
      <SelectExecutor address={activeSigner?.value as Address} txId={txId} />

      <SafeButton onPress={handleConfirmPress} width="100%">
        Execute transaction
      </SafeButton>
    </Stack>
  )
}
