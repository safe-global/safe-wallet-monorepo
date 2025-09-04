import { SafeButton } from '@/src/components/SafeButton'
import React from 'react'
import { Stack, YStack } from 'tamagui'
import { Address } from '@/src/types/address'
import { router } from 'expo-router'
import { useTransactionSigner } from '@/src/features/ConfirmTx/hooks/useTransactionSigner'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SelectExecutor } from '@/src/components/SelectExecutor'

interface ExecuteFormProps {
  txId: string
}

export function ExecuteForm({ txId }: ExecuteFormProps) {
  const { signerState } = useTransactionSigner(txId)
  const { activeSigner } = signerState
  const insets = useSafeAreaInsets()

  return (
    <YStack>
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

        <SafeButton
          width="100%"
          testID="confirm-button"
          onPress={() => router.push({ pathname: '/execute-transaction', params: { txId } })}
        >
          Execute transaction
        </SafeButton>
      </Stack>
    </YStack>
  )
}
