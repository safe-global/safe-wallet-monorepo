import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, getTokenValue, YStack } from 'tamagui'
import { router, useLocalSearchParams, useGlobalSearchParams, useNavigation } from 'expo-router'
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
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { getUserNonce } from '@/src/services/web3'
import { ExecuteProcessing } from '@/src/features/ExecuteTx/components/ExecuteProcessing'
import { ExecuteError } from '@/src/features/ExecuteTx/components/ExecuteError'
import { parseFeeParams } from '@/src/utils/feeParams'
import { Container } from '@/src/components/Container'
import useGasFee from '../ExecuteTx/hooks/useGasFee'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { LargeHeaderTitle, NavBarTitle } from '@/src/components/Title'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'

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
  const { handleScroll } = useScrollableHeader({
    children: (
      <>
        <NavBarTitle numberOfLines={1}>Review and execute transaction on Ledger</NavBarTitle>
      </>
    ),
  })
  const navigation = useNavigation()
  const feeParams = useMemo(() => parseFeeParams(globalParams), [globalParams])
  // We are so deep in the stack and have already called useTransactionData multiple time
  // so chances that txDetails here is undefined are really slim
  const { totalFeeEth } = useGasFee(txDetails || ({} as TransactionDetails), feeParams)

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
          type: ExecutionMethod.WITH_PK,
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

  useEffect(() => {
    if ([ExecutionState.ERROR, ExecutionState.PROCESSING].includes(executionState)) {
      navigation.setOptions({ headerShown: false })
    }
    return () => navigation.setOptions({ headerShown: true })
  }, [executionState])

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
    return (
      <ExecuteError
        onRetryPress={handleRetry}
        onViewTransactionPress={() => {
          router.dismissTo({
            pathname: '/confirm-transaction',
            params: {
              txId,
            },
          })
        }}
        description={error || 'Failed to execute with Ledger'}
      />
    )
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

  // Show review state (default)
  return (
    <View flex={1} padding="$4" gap="$4" paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <ScrollView onScroll={handleScroll}>
        <LargeHeaderTitle marginRight={5}>Review and execute transaction on Ledger</LargeHeaderTitle>

        <Container borderRadius="$4" padding="$4" gap="$4" marginTop="$4">
          <YStack gap="$2">
            <Text fontSize="$3" color="$colorSecondary">
              From
            </Text>
            <Text fontSize="$5" color="$color">
              {activeSigner?.value}
            </Text>
          </YStack>
          <YStack gap="$2">
            <Text fontSize="$3" color="$colorSecondary">
              To
            </Text>
            <Text fontSize="$5" color="$color">
              {activeSafe.address}
            </Text>
          </YStack>
          <YStack gap="$2">
            <Text fontSize="$3" color="$colorSecondary">
              Max fees
            </Text>
            <Text fontSize="$5" color="$color">
              {totalFeeEth}
            </Text>
          </YStack>
          <YStack gap="$2">
            <Text fontSize="$3" color="$colorSecondary">
              Network
            </Text>
            <Text fontSize="$5" color="$color">
              {chain?.chainName}
            </Text>
          </YStack>
          <YStack gap="$2">
            <Text fontSize="$3" color="$colorSecondary">
              MessageHash
            </Text>
            <Text fontSize="$5" color="$color">
              {messageHash || '—'}
            </Text>
          </YStack>
        </Container>
      </ScrollView>
      <SafeButton
        onPress={handleExecute}
        icon={executionState === ExecutionState.EXECUTING ? <Loader size={18} thickness={2} /> : null}
        disabled={executionState === ExecutionState.EXECUTING}
      >
        {executionState === ExecutionState.EXECUTING ? 'Execute on Ledger...' : 'Continue on Ledger'}
      </SafeButton>
    </View>
  )
}
