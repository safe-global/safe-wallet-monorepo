import { LoadingScreen } from '@/src/components/LoadingScreen'
import React, { useEffect, useMemo } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { ExecuteError } from './ExecuteError'
import { ExecuteProcessing } from '@/src/features/ExecuteTx/components/ExecuteProcessing'
import { ExecutionStatus, useTransactionExecutionWithPK } from '../hooks/useTransactionExecutionWithPK'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useTransactionGuard } from '@/src/hooks/useTransactionGuard'
import { parseFeeParams } from '@/src/utils/feeParams'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'

export function ExecuteTransaction() {
  const { txId, maxFeePerGas, executionMethod, maxPriorityFeePerGas, gasLimit, nonce } = useLocalSearchParams<{
    txId: string
    maxFeePerGas: string
    executionMethod: ExecutionMethod
    maxPriorityFeePerGas: string
    gasLimit: string
    nonce: string
  }>()

  const feeParams = useMemo(
    () => parseFeeParams({ maxFeePerGas, maxPriorityFeePerGas, gasLimit, nonce }),
    [maxFeePerGas, maxPriorityFeePerGas, gasLimit, nonce],
  )

  const activeSafe = useDefinedActiveSafe()
  const activeSigner = useAppSelector((state) => selectActiveSigner(state, activeSafe.address))
  const { guard: canExecute } = useTransactionGuard('executing')
  const { status, executeTx, retry, executeInRelay } = useTransactionExecutionWithPK({
    txId: txId || '',
    executionMethod,
    signerAddress: activeSigner?.value || '',
    feeParams,
  })

  useEffect(() => {
    if (canExecute && status === ExecutionStatus.IDLE && txId) {
      if (executionMethod === ExecutionMethod.RELAYER) {
        executeInRelay()
      } else if (activeSigner) {
        executeTx()
      }
    }
  }, [canExecute, status, feeParams, executeTx, txId, activeSigner])

  const handleViewTransaction = () => {
    router.dismissTo({
      pathname: '/confirm-transaction',
      params: {
        txId,
      },
    })
  }
  if (!txId) {
    const handleRetry = () => {
      console.error('Cannot retry: missing transaction ID')
    }
    return (
      <ExecuteError
        description="Missing transaction ID"
        onRetryPress={handleRetry}
        onViewTransactionPress={handleViewTransaction}
      />
    )
  }

  if (!activeSigner) {
    const handleRetry = () => {
      console.error('Cannot retry: no active signer')
    }
    return (
      <ExecuteError
        description="No signer selected"
        onRetryPress={handleRetry}
        onViewTransactionPress={handleViewTransaction}
      />
    )
  }

  if (status === ExecutionStatus.ERROR) {
    return (
      <ExecuteError
        onRetryPress={retry}
        description="There was an error executing the transaction."
        onViewTransactionPress={handleViewTransaction}
      />
    )
  }

  if (status === ExecutionStatus.PROCESSING) {
    return (
      <ExecuteProcessing
        handleHomePress={() => {
          router.dismissAll()
        }}
      />
    )
  }

  return <LoadingScreen title="Executing transaction..." description="It may take a few seconds..." />
}
