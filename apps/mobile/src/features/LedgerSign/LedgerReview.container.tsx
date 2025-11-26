import React, { useEffect, useRef } from 'react'
import { View, Stack, YStack } from 'tamagui'
import { useLocalSearchParams, router } from 'expo-router'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'
import { Loader } from '@/src/components/Loader'
import { SafeButton } from '@/src/components/SafeButton'
import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ReviewAndConfirmView } from '@/src/features/ConfirmTx/components/ReviewAndConfirm/ReviewAndConfirmView'
import { LargeHeaderTitle } from '@/src/components/Title'
import { useTransactionSigningState } from '@/src/hooks/useTransactionSigningState'
import { useTransactionSigning } from '@/src/features/ConfirmTx/components/SignTransaction/hooks/useTransactionSigning'
import { useTransactionSigner } from '@/src/features/ConfirmTx/hooks/useTransactionSigner'

export const LedgerReviewSignContainer = () => {
  const { bottom } = useSafeAreaInsets()
  const { txId, sessionId } = useLocalSearchParams<{ txId: string; sessionId: string }>()
  const { data: txDetails, isLoading: isLoadingTx } = useTransactionData(txId || '')

  // Track if component is mounted to handle navigation in closure
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Get the active signer for this transaction
  const { signerState } = useTransactionSigner(txId || '')
  const { activeSigner } = signerState

  // Use the unified signing hook - handles both Ledger and private key signing
  const { executeSign } = useTransactionSigning({
    txId: txId || '',
    signerAddress: activeSigner?.value || '',
  })

  // Get global signing state for this transaction
  const { isSigning } = useTransactionSigningState(txId || '')

  useEffect(() => {
    if (!sessionId) {
      // Navigate to error route if no session
      router.push({
        pathname: '/signing-error',
        params: { description: 'No Ledger session. Please reconnect.' },
      })
    }
  }, [sessionId])

  const handleSign = async () => {
    // Prevent multiple submissions
    if (isSigning) {
      return
    }

    try {
      await executeSign()

      // Disconnect Ledger to prevent DMK background pinger from continuing after signing
      await ledgerDMKService.disconnect()

      if (isMountedRef.current) {
        router.replace('/signing-success')
      }
    } catch (e) {
      console.error('Ledger signing error:', e)
      const errorMessage = e instanceof Error ? e.message : 'Failed to sign with Ledger'

      if (isMountedRef.current) {
        router.push({
          pathname: '/signing-error',
          params: { description: errorMessage },
        })
      }
    }
  }

  if (isLoadingTx || !txDetails) {
    return (
      <View flex={1} alignItems="center" justifyContent="center">
        <Loader />
      </View>
    )
  }

  return (
    <ReviewAndConfirmView
      txDetails={txDetails}
      header={
        <YStack space="$4" paddingTop="$4">
          <LargeHeaderTitle>Review and confirm on your device</LargeHeaderTitle>
        </YStack>
      }
    >
      <Stack
        backgroundColor="$background"
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderTopWidth={1}
        borderTopColor="$borderLight"
        space="$3"
        paddingBottom={bottom || '$4'}
      >
        <SafeButton onPress={handleSign} disabled={isSigning} loading={isSigning}>
          Continue on Ledger
        </SafeButton>
      </Stack>
    </ReviewAndConfirmView>
  )
}
