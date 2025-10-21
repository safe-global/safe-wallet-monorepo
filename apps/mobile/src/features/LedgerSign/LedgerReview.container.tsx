import React, { useEffect, useState } from 'react'
import { View, Text, Stack, YStack } from 'tamagui'
import { useLocalSearchParams, router } from 'expo-router'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'
import { ledgerSafeSigningService } from '@/src/services/ledger/ledger-safe-signing.service'
import { Loader } from '@/src/components/Loader'
import { SafeButton } from '@/src/components/SafeButton'
import { useGuard } from '@/src/context/GuardProvider'
import { useTransactionsAddConfirmationV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'
import useSafeInfo from '@/src/hooks/useSafeInfo'
import type { SafeVersion } from '@safe-global/types-kit'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ReviewAndConfirmView } from '@/src/features/ConfirmTx/components/ReviewAndConfirm/ReviewAndConfirmView'
import { LargeHeaderTitle } from '@/src/components/Title'

export const LedgerReviewSignContainer = () => {
  const { bottom } = useSafeAreaInsets()
  const { txId, sessionId } = useLocalSearchParams<{ txId: string; sessionId: string }>()
  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((s) => selectChainById(s, activeSafe.chainId))
  const { safe } = useSafeInfo()
  const activeSigner = useAppSelector((s) => selectActiveSigner(s, activeSafe.address))
  const { resetGuard } = useGuard()
  const { data: txDetails, isFetching } = useTransactionData(txId || '')
  const [isSigning, setIsSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addConfirmation] = useTransactionsAddConfirmationV1Mutation()

  useEffect(() => {
    if (!sessionId) {
      setError('No Ledger session. Please reconnect.')
    }
  }, [sessionId])

  const handleSign = async () => {
    if (!txId || !activeSigner?.derivationPath || !activeSigner?.value) {
      setError('Missing signing context')
      return
    }

    try {
      setIsSigning(true)
      setError(null)
      if (!chain) {
        throw new Error('Missing chain information')
      }
      if (!safe.version) {
        throw new Error('Safe version not available for Ledger signing')
      }

      const { signature, safeTransactionHash } = await ledgerSafeSigningService.signSafeTransaction({
        chain,
        activeSafe,
        txId,
        signerAddress: activeSigner.value,
        derivationPath: activeSigner.derivationPath,
        safeVersion: safe.version as SafeVersion,
      })

      await addConfirmation({
        chainId: activeSafe.chainId,
        safeTxHash: safeTransactionHash,
        addConfirmationDto: {
          // @ts-ignore new signature type supported in CGW
          signature,
        },
      })

      resetGuard('signing')
      // Disconnect to prevent DMK background pinger from continuing after signing
      await ledgerDMKService.disconnect()
      // Navigate to success screen
      router.push('/sign-transaction/ledger-success')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to sign with Ledger'
      setError(message)
    } finally {
      setIsSigning(false)
    }
  }

  if (isFetching || !txDetails) {
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
        {error ? (
          <Text color="$error" textAlign="center">
            {error}
          </Text>
        ) : null}
        <SafeButton
          onPress={handleSign}
          disabled={isSigning}
          icon={isSigning ? <Loader size={18} thickness={2} /> : null}
        >
          Continue on Ledger
        </SafeButton>
      </Stack>
    </ReviewAndConfirmView>
  )
}
