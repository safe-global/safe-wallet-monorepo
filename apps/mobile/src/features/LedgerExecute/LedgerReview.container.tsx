import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, getTokenValue } from 'tamagui'
import { router, useLocalSearchParams, useGlobalSearchParams } from 'expo-router'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector, useAppDispatch } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'
import { ledgerExecutionService } from '@/src/services/ledger/ledger-execution.service'
import { Loader } from '@/src/components/Loader'
import { SafeButton } from '@/src/components/SafeButton'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'
import logger from '@/src/utils/logger'
import useSafeInfo from '@/src/hooks/useSafeInfo'
import extractTxInfo from '@/src/services/tx/extractTx'
import { getSafeTxMessageHash } from '@safe-global/utils/utils/safe-hashes'
import type { SafeVersion } from '@safe-global/types-kit'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { addPendingTx } from '@/src/store/pendingTxsSlice'
import { getUserNonce } from '@/src/services/web3'
import { ExecuteProcessing } from '@/src/features/ExecuteTx/components/ExecuteProcessing'
import { ExecuteError } from '@/src/features/ExecuteTx/components/ExecuteError'
import { LoadingScreen } from '@/src/components/LoadingScreen'
import { parseFeeParams } from '@/src/utils/feeParams'

enum ExecutionState {
  REVIEW = 'review',
  EXECUTING = 'executing',
  PROCESSING = 'processing',
  ERROR = 'error',
}

export const LedgerReviewExecuteContainer = () => {
  const { bottom } = useSafeAreaInsets()
  const { txId, sessionId } = useLocalSearchParams<{ txId: string; sessionId: string }>()
  const globalParams = useGlobalSearchParams<{
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
    gasLimit?: string
    nonce?: string
  }>()
  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((s) => selectChainById(s, activeSafe.chainId))
  const { safe } = useSafeInfo()
  const activeSigner = useAppSelector((s) => selectActiveSigner(s, activeSafe.address))
  const { data: txDetails, isFetching } = useTransactionData(txId || '')
  const [executionState, setExecutionState] = useState<ExecutionState>(ExecutionState.REVIEW)
  const [error, setError] = useState<string | null>(null)
  const dispatch = useAppDispatch()

  const feeParams = useMemo(() => parseFeeParams(globalParams), [globalParams])

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
      setExecutionState(ExecutionState.ERROR)
    }
  }, [sessionId])

  const handleExecute = async () => {
    if (!txId || !activeSigner?.derivationPath || !activeSigner?.value) {
      setError('Missing execution context')
      setExecutionState(ExecutionState.ERROR)
      return
    }

    try {
      setExecutionState(ExecutionState.EXECUTING)
      setError(null)
      if (!chain) {
        throw new Error('Missing chain information')
      }

      // Execute with Ledger
      const { hash } = await ledgerExecutionService.executeTransaction({
        chain,
        activeSafe,
        txId,
        signerAddress: activeSigner.value,
        derivationPath: activeSigner.derivationPath,
        feeParams,
      })

      // Get wallet nonce for tracking
      const walletNonce = await getUserNonce(chain, activeSigner.value)

      // Add to pending transactions
      dispatch(
        addPendingTx({
          txId,
          chainId: activeSafe.chainId,
          safeAddress: activeSafe.address,
          txHash: hash,
          walletAddress: activeSigner.value,
          walletNonce,
        }),
      )

      // Disconnect to prevent DMK background pinger from continuing after execution
      await ledgerDMKService.disconnect()

      // Show processing state
      setExecutionState(ExecutionState.PROCESSING)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to execute with Ledger'
      setError(message)
      setExecutionState(ExecutionState.ERROR)
    }
  }

  const handleRetry = () => {
    setExecutionState(ExecutionState.REVIEW)
    setError(null)
  }

  if (isFetching || !txDetails) {
    return (
      <View flex={1} alignItems="center" justifyContent="center">
        <Loader />
      </View>
    )
  }

  // Show error state
  if (executionState === ExecutionState.ERROR) {
    return <ExecuteError onRetryPress={handleRetry} description={error || 'Failed to execute with Ledger'} />
  }

  // Show processing state (transaction submitted successfully)
  if (executionState === ExecutionState.PROCESSING) {
    return (
      <ExecuteProcessing
        handleHomePress={() => {
          // We create several router contexts and we need to dismiss once the ledger navigation & then the execute navigation
          router.dismissAll()
          router.dismissAll()
        }}
      />
    )
  }

  // Show executing state (waiting for Ledger device)
  if (executionState === ExecutionState.EXECUTING) {
    return <LoadingScreen title="Executing on Ledger..." description="Please confirm on your device" />
  }

  // Show review state (default)
  return (
    <View flex={1} padding="$4" gap="$4" paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <ScrollView>
        <Text fontSize="$9" fontWeight="600" color="$color" numberOfLines={2}>
          Review and execute transaction on Ledger
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
      </ScrollView>
      <SafeButton onPress={handleExecute}>Continue on Ledger</SafeButton>
    </View>
  )
}
