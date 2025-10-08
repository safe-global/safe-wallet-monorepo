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

export function ExecuteTransaction() {
  const { txId, maxFeePerGas, maxPriorityFeePerGas, gasLimit, nonce } = useLocalSearchParams<{
    txId: string
    maxFeePerGas: string
    maxPriorityFeePerGas: string
    gasLimit: string
    nonce: string
  }>()

  // Convert string params to bigint/number
  const feeParams = useMemo(() => {
    if (maxFeePerGas && maxPriorityFeePerGas && gasLimit && nonce) {
      return {
        maxFeePerGas: BigInt(maxFeePerGas),
        maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
        gasLimit: BigInt(gasLimit),
        nonce: parseInt(nonce, 10),
      }
    }
    return null
  }, [maxFeePerGas, maxPriorityFeePerGas, gasLimit, nonce])

  const activeSafe = useDefinedActiveSafe()
  const activeSigner = useAppSelector((state) => selectActiveSigner(state, activeSafe.address))
  const { guard: canExecute } = useTransactionGuard('executing')
  const { status, executeTx, retry } = useTransactionExecutionWithPK({
    txId: txId || '',
    signerAddress: activeSigner?.value || '',
    feeParams,
  })

  useEffect(() => {
    if (canExecute && status === ExecutionStatus.IDLE && txId && activeSigner) {
      executeTx()
    }
  }, [canExecute, status, feeParams, executeTx, txId, activeSigner])

  if (!txId) {
    const handleRetry = () => {
      console.error('Cannot retry: missing transaction ID')
    }
    return <ExecuteError description="Missing transaction ID" onRetryPress={handleRetry} />
  }

  if (!activeSigner) {
    const handleRetry = () => {
      console.error('Cannot retry: no active signer')
    }
    return <ExecuteError description="No signer selected" onRetryPress={handleRetry} />
  }

  if (status === ExecutionStatus.ERROR) {
    return <ExecuteError onRetryPress={retry} description="There was an error executing the transaction." />
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
