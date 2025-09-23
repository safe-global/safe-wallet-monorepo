import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, getTokenValue } from 'tamagui'
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
import logger from '@/src/utils/logger'
import useSafeInfo from '@/src/hooks/useSafeInfo'
import extractTxInfo from '@/src/services/tx/extractTx'
import { getSafeTxMessageHash } from '@safe-global/utils/utils/safe-hashes'
import type { SafeVersion } from '@safe-global/types-kit'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
  const messageHash = useMemo(() => {
    try {
      if (!txId || !chain || !txDetails || !safe.version) {
        return null
      }
      const { txParams } = extractTxInfo(txDetails, activeSafe.address)
      return getSafeTxMessageHash({
        safeVersion: safe.version as SafeVersion,
        safeTxData: txParams,
      })
    } catch (e) {
      logger.info('Failed to pre-compute message hash', e)
      return null
    }
  }, [txId, chain, txDetails, safe.version, activeSafe.address])

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
    <View flex={1} padding="$4" gap="$4" paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <ScrollView>
        <Text fontSize="$9" fontWeight="600" color="$color" numberOfLines={2}>
          Review and confirm transaction on Ledger
        </Text>

        <View backgroundColor="$backgroundPaper" borderRadius="$4" padding="$4" gap="$4">
          <View>
            <Text fontSize="$3" color="$colorSecondary">
              chainId
            </Text>
            <Text fontSize="$5" color="$color">
              {chain?.chainId}
            </Text>
          </View>
          <View>
            <Text fontSize="$3" color="$colorSecondary">
              verifyingContract
            </Text>
            <Text fontSize="$5" color="$color">
              {activeSafe.address}
            </Text>
          </View>
          <View>
            <Text fontSize="$3" color="$colorSecondary">
              messageHash
            </Text>
            <Text fontSize="$5" color="$color">
              {messageHash || '—'}
            </Text>
          </View>
        </View>

        {error ? <Text color="$error">{error}</Text> : null}
      </ScrollView>
      <SafeButton
        onPress={handleSign}
        disabled={isSigning}
        icon={isSigning ? <Loader size={18} thickness={2} /> : null}
      >
        Continue on Ledger
      </SafeButton>
    </View>
  )
}
