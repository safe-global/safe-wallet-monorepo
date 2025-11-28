import React, { useMemo } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { Loader } from '@/src/components/Loader'
import { Text, View } from 'tamagui'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'
import { ReviewAndConfirmView } from '@/src/features/ConfirmTx/components/ReviewAndConfirm'
import { ReviewExecuteFooter } from './ReviewExecuteFooter'
import { ReviewExecuteFooterSkeleton } from './ReviewExecuteFooterSkeleton'
import { useClearEstimatedFeeOnMount } from '@/src/features/ExecuteTx/hooks/useClearEstimatedFeeOnMount'
import { useRelayGetRelaysRemainingV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useTransactionSigner } from '@/src/features/ConfirmTx/hooks/useTransactionSigner'
import { useBiometrics } from '@/src/hooks/useBiometrics'
import { useAppSelector } from '@/src/store/hooks'
import { selectEstimatedFee } from '@/src/store/estimatedFeeSlice'
import { selectExecutionMethod } from '@/src/store/executionMethodSlice'
import { selectActiveChain } from '@/src/store/chains'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { getExecutionMethod } from './helpers'
import { parseFeeParams } from '@/src/utils/feeParams'
import useGasFee from '../../hooks/useGasFee'
import { useTransactionExecution } from '../../hooks/useTransactionExecution'
import { useExecutionFunds } from '../../hooks/useExecutionFunds'
import { useExecutionFlow } from '../../hooks/useExecutionFlow'

export function ReviewAndExecuteContainer() {
  const { txId } = useLocalSearchParams<{ txId: string }>()

  const { data: txDetails, isLoading, isError } = useTransactionData(txId || '')

  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector(selectActiveChain)
  const { isBiometricsEnabled } = useBiometrics()

  // Check relay availability
  const { currentData: relaysRemaining, isLoading: isLoadingRelays } = useRelayGetRelaysRemainingV1Query({
    chainId: activeSafe.chainId,
    safeAddress: activeSafe.address,
  })
  // Clear estimated fee values when screen is mounted
  useClearEstimatedFeeOnMount()

  // Signer
  const { signerState } = useTransactionSigner(txId || '')
  const { activeSigner } = signerState

  // Execution method (considers relay availability and signer type)
  const storedExecutionMethod = useAppSelector(selectExecutionMethod)
  const isRelayAvailable = Boolean(relaysRemaining?.remaining && relaysRemaining.remaining > 0)
  const executionMethod = chain
    ? getExecutionMethod(storedExecutionMethod, isRelayAvailable, chain, activeSigner)
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

  // Execution
  const { execute } = useTransactionExecution({
    txId: txId || '',
    executionMethod,
    signerAddress: activeSigner?.value || '',
    feeParams,
  })

  // Execution flow (state + handler)
  const { isExecuting, handleConfirmPress } = useExecutionFlow({
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

  if (isError || !txDetails) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Text>Error loading transaction details</Text>
      </View>
    )
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
    </ReviewAndConfirmView>
  )
}
