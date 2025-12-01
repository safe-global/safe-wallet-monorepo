import React from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { Loader } from '@/src/components/Loader'
import { Text, View } from 'tamagui'
import { ReviewAndConfirmView } from './ReviewAndConfirmView'
import { useTransactionData } from '../../hooks/useTransactionData'
import { ReviewFooter } from '@/src/features/ConfirmTx/components/ReviewAndConfirm/ReviewFooter'
import { useTransactionSigning } from '@/src/features/ConfirmTx/components/SignTransaction/hooks/useTransactionSigning'
import { useTransactionSigner } from '@/src/features/ConfirmTx/hooks/useTransactionSigner'
import { useTransactionSigningState } from '@/src/hooks/useTransactionSigningState'
import { useBiometrics } from '@/src/hooks/useBiometrics'
import { useIsMounted } from '@/src/hooks/useIsMounted'

export function ReviewAndConfirmContainer() {
  const { txId } = useLocalSearchParams<{ txId: string }>()
  const { data: txDetails, isLoading, isError } = useTransactionData(txId || '')
  const { isBiometricsEnabled } = useBiometrics()
  const isMounted = useIsMounted()

  const { signerState } = useTransactionSigner(txId || '')
  const { activeSigner } = signerState

  const { executeSign } = useTransactionSigning({
    txId: txId || '',
    signerAddress: activeSigner?.value || '',
  })

  // Get global signing state for this transaction
  const { isSigning } = useTransactionSigningState(txId || '')

  const handleConfirmPress = async () => {
    // Prevent action if already signing
    if (isSigning) {
      return
    }

    // If active signer is a Ledger device, start the Ledger-specific signing flow
    if (activeSigner?.type === 'ledger') {
      router.push({
        pathname: '/sign-transaction/ledger-connect',
        params: { txId },
      })
      return
    }

    if (!isBiometricsEnabled) {
      router.push({
        pathname: '/biometrics-opt-in',
        params: { txId, caller: '/review-and-confirm' },
      })
      return
    }

    try {
      await executeSign()
      if (isMounted()) {
        router.replace({
          pathname: '/signing-success',
          params: { txId },
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign transaction'

      if (isMounted()) {
        router.push({
          pathname: '/signing-error',
          params: { description: errorMessage },
        })
      }
    }
  }

  if (!txId) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Text>Missing transaction ID</Text>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Loader />
      </View>
    )
  }

  if (isError || !txDetails) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Text>Error loading transaction details</Text>
      </View>
    )
  }

  return (
    <ReviewAndConfirmView txDetails={txDetails}>
      <ReviewFooter
        txId={txId}
        activeSigner={activeSigner}
        isSigningLoading={isSigning}
        onConfirmPress={handleConfirmPress}
      />
    </ReviewAndConfirmView>
  )
}
