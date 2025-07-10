import { LoadingScreen } from '@/src/components/LoadingScreen'
import React, { useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router'
import SignError from './SignError'
import SignSuccess from './SignSuccess'
import { useSigningGuard } from './hooks/useSigningGuard'
import { useTransactionSigning } from './hooks/useTransactionSigning'

export function SignTransaction() {
  const { txId, signerAddress } = useLocalSearchParams<{ txId: string; signerAddress: string }>()

  if (!txId || !signerAddress) {
    const handleRetry = () => {
      // Cannot retry missing parameters - this is a configuration error
      console.error('Cannot retry: missing transaction parameters')
    }
    return <SignError description="Missing transaction ID or signer address" onRetryPress={handleRetry} />
  }

  const { canSign } = useSigningGuard()
  const { status, executeSign, retry, isApiLoading, isApiError } = useTransactionSigning({ txId, signerAddress })

  // Auto-sign when component mounts if user can sign
  useEffect(() => {
    if (canSign && status === 'idle') {
      executeSign()
    }
  }, [canSign, status, executeSign])

  // Handle API errors
  if (isApiError) {
    return <SignError onRetryPress={retry} description="Failed to submit transaction confirmation" />
  }

  // Handle signing errors
  if (status === 'error') {
    return <SignError onRetryPress={retry} description="There was an error signing the transaction." />
  }

  // Handle success
  if (status === 'success') {
    return <SignSuccess />
  }

  // Show loading state
  if (status === 'loading' || isApiLoading) {
    return <LoadingScreen title="Signing transaction..." description="It may take a few seconds..." />
  }

  // This should rarely be reached (idle state while authorized)
  return <LoadingScreen title="Preparing to sign..." description="Initializing signing process..." />
}
