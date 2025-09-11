import { LoadingScreen } from '@/src/components/LoadingScreen'
import React, { useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { ExecuteError } from './ExecuteError'
import { ExecuteProcessing } from '@/src/features/ExecuteTx/components/ExecuteProcessing'
import { ExecutionStatus, useTransactionExecution } from '../hooks/useTransactionExecution'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useTransactionGuard } from '@/src/hooks/useTransactionGuard'

export function ExecuteTransaction() {
  const { txId } = useLocalSearchParams<{ txId: string }>()
  const activeSafe = useDefinedActiveSafe()
  const activeSigner = useAppSelector((state) => selectActiveSigner(state, activeSafe.address))
  const { guard: canExecute } = useTransactionGuard('executing')
  const { status, executeTx, retry } = useTransactionExecution({
    txId: txId || '',
    signerAddress: activeSigner?.value || '',
  })

  useEffect(() => {
    if (canExecute && status === ExecutionStatus.IDLE && txId && activeSigner) {
      executeTx()
    }
  }, [canExecute, status, executeTx, txId, activeSigner])

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
    return <ExecuteProcessing txId={txId} />
  }

  return <LoadingScreen title="Executing transaction..." description="It may take a few seconds..." />
}
