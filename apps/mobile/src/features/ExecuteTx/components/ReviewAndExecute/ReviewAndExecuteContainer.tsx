import React, { useMemo } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Loader } from '@/src/components/Loader'
import { Text, View } from 'tamagui'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'
import { ReviewAndConfirmView } from '@/src/features/ConfirmTx/components/ReviewAndConfirm'
import { ReviewExecuteFooter } from './ReviewExecuteFooter'
import { ReviewExecuteFooterSkeleton } from './ReviewExecuteFooterSkeleton'
import { useClearEstimatedFeeOnMount } from '@/src/features/ExecuteTx/hooks/useClearEstimatedFeeOnMount'
import { useRequiresRelay } from '@/src/features/ExecuteTx/hooks/useRequiresRelay'
import { RelayUnavailableSheet } from '@/src/features/HowToExecuteSheet/components/RelayUnavailableSheet/RelayUnavailableSheet'
import { useTransactionSigner } from '@/src/features/ConfirmTx/hooks/useTransactionSigner'
import { useBiometrics } from '@/src/hooks/useBiometrics'
import { useAppSelector } from '@/src/store/hooks'
import { selectEstimatedFee } from '@/src/store/estimatedFeeSlice'
import { selectExecutionMethod } from '@/src/store/executionMethodSlice'
import { selectActiveChain } from '@/src/store/chains'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { getExecutionMethod } from './helpers'
import { parseFeeParams } from '@/src/utils/feeParams'
import { useOptionalWalletConnectContext } from '@/src/features/WalletConnect/Signer/context/WalletConnectContext'
import useGasFee from '../../hooks/useGasFee'
import { useTransactionExecution } from '../../hooks/useTransactionExecution'
import { useExecutionFunds } from '../../hooks/useExecutionFunds'
import { useExecutionFlow } from '../../hooks/useExecutionFlow'
import { IndeterminateSimulationSheet } from '../IndeterminateSimulationSheet/IndeterminateSimulationSheet'

export function ReviewAndExecuteContainer() {
  const router = useRouter()
  const { txId } = useLocalSearchParams<{ txId: string }>()

  const { currentData: txDetails, isLoading, isError } = useTransactionData(txId || '')

  const chain = useAppSelector(selectActiveChain)
  const { isBiometricsEnabled } = useBiometrics()

  const { requiresRelay, isRelayEnabled, isRelayAvailable, isLoadingRelays } = useRequiresRelay(txDetails)
  // Clear estimated fee values when screen is mounted
  useClearEstimatedFeeOnMount()

  // Signer
  const { signerState } = useTransactionSigner(txId || '')
  const { activeSigner } = signerState

  // Execution method (considers relay availability and signer type)
  const storedExecutionMethod = useAppSelector(selectExecutionMethod)
  const executionMethod = chain
    ? getExecutionMethod(storedExecutionMethod, isRelayAvailable, chain, activeSigner, requiresRelay)
    : ExecutionMethod.WITH_PK

  // Gas fees
  const manualParams = useAppSelector(selectEstimatedFee)
  const { totalFee, estimatedFeeParams, totalFeeRaw } = useGasFee(txDetails, manualParams)

  // Fee params for execution
  const feeParams = useMemo(
    () =>
      parseFeeParams({
        maxFeePerGas: estimatedFeeParams.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: estimatedFeeParams.maxPriorityFeePerGas?.toString(),
        gasLimit: estimatedFeeParams.gasLimit?.toString(),
        nonce: estimatedFeeParams.nonce?.toString(),
      }),
    [estimatedFeeParams],
  )

  // WalletConnect provider
  const wcContext = useOptionalWalletConnectContext()

  // Execution
  const { execute } = useTransactionExecution({
    txId: txId || '',
    executionMethod,
    signerAddress: activeSigner?.value || '',
    feeParams,
    wcProvider: wcContext?.provider,
  })

  // Execution flow (state + handler)
  const { isExecuting, handleConfirmPress, showIndeterminateSheet, dismissIndeterminateSheet, confirmExecuteAnyway } =
    useExecutionFlow({
      txId: txId || '',
      activeSigner,
      isBiometricsEnabled,
      executionMethod,
      feeParams: estimatedFeeParams,
      execute,
    })

  // Funds check
  const { hasSufficientFunds, isCheckingFunds } = useExecutionFunds({
    signerAddress: activeSigner?.value,
    totalFeeRaw,
    executionMethod,
    chain: chain ?? undefined,
  })

  // Derived display state
  const isLoadingFees = estimatedFeeParams.isLoadingGasPrice || estimatedFeeParams.gasLimitLoading
  const willFail = Boolean(estimatedFeeParams.gasLimitError)

  // Loading and error states
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

  if ((isError && !txDetails) || !txDetails) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Text>Error loading transaction details</Text>
      </View>
    )
  }

  // Safe-pays txs can only be relayed. With no signer fallback possible, surface a terminal state
  // when the chain doesn't support relaying instead of letting the (double-charging) signer route run.
  if (requiresRelay && !isRelayEnabled) {
    return <RelayUnavailableSheet onDismiss={() => router.back()} />
  }

  return (
    <ReviewAndConfirmView txDetails={txDetails}>
      {isLoadingRelays ? (
        <ReviewExecuteFooterSkeleton />
      ) : (
        <ReviewExecuteFooter
          txId={txId}
          activeSigner={activeSigner}
          executionMethod={executionMethod}
          totalFee={totalFee}
          isLoadingFees={isLoadingFees}
          willFail={willFail}
          hasSufficientFunds={hasSufficientFunds}
          isCheckingFunds={isCheckingFunds}
          isExecuting={isExecuting}
          onConfirmPress={handleConfirmPress}
        />
      )}

      {showIndeterminateSheet && (
        <IndeterminateSimulationSheet onConfirm={confirmExecuteAnyway} onDismiss={dismissIndeterminateSheet} />
      )}
    </ReviewAndConfirmView>
  )
}
