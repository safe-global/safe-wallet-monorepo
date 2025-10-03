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
import { EstimatedNetworkFee } from '../EstimatedNetworkFee'
import { Container } from '@/src/components/Container'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useGasFee from '../../hooks/useGasFee'

interface ReviewFooterProps {
  txId: string
  txDetails: TransactionDetails
}

export function ReviewExecuteFooter({ txId, txDetails }: ReviewFooterProps) {
  const { signerState } = useTransactionSigner(txId)
  const { activeSigner } = signerState
  const { isBiometricsEnabled } = useBiometrics()
  const { setGuard } = useGuard()
  const insets = useSafeAreaInsets()
  const totalFee = useGasFee(txDetails)

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
      paddingHorizontal="$4"
      space="$3"
      paddingBottom={insets.bottom ? insets.bottom : '$4'}
    >
      <Container backgroundColor="transparent" gap={'$2'} borderWidth={1} paddingVertical={'$3'} borderColor="$borderLight">
        <SelectExecutor address={activeSigner?.value as Address} txId={txId} />

        <EstimatedNetworkFee txId={txId} totalFee={totalFee} />
      </Container>

      <SafeButton onPress={handleConfirmPress} width="100%">
        Execute transaction
      </SafeButton>
    </Stack>
  )
}
