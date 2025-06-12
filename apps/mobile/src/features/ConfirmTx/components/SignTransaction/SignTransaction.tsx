import { LoadingScreen } from '@/src/components/LoadingScreen'
import React, { useCallback, useLayoutEffect, useState } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { RootState } from '@/src/store'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useLocalSearchParams } from 'expo-router'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import SignError from './SignError'
import SignSuccess from './SignSuccess'
import { signTx } from '@/src/services/tx/tx-sender/sign'
import { useTransactionsAddConfirmationV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import logger from '@/src/utils/logger'

export function SignTransaction() {
  const { txId, signerAddress } = useLocalSearchParams<{ txId: string; signerAddress: string }>()
  const [signStepStatus, setSignStepStatus] = useState<'error' | 'success' | 'loading'>('loading')
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))

  const [addConfirmation, { isLoading, data, isError }] = useTransactionsAddConfirmationV1Mutation()

  const sign = useCallback(async () => {
    try {
      const privateKey = await getPrivateKey(signerAddress)

      if (!privateKey) {
        setSignStepStatus('error')
        return
      }

      const signedTx = await signTx({
        chain: activeChain as ChainInfo,
        activeSafe,
        txId,
        privateKey,
      })

      // Now call the mutation with the signed transaction data
      await addConfirmation({
        chainId: activeSafe.chainId,
        safeTxHash: signedTx.safeTransactionHash,
        addConfirmationDto: {
          // TODO: we need to add this signature type in the auto generated types, because it was included recently in CGW
          // @ts-ignore
          signature: signedTx.signature,
        },
      })
    } catch (error) {
      logger.error('Error signing transaction:', error)
      setSignStepStatus('error')
    }
  }, [activeChain, activeSafe, txId, signerAddress])

  useLayoutEffect(() => {
    sign()
  }, [sign])

  if (signStepStatus === 'error') {
    return <SignError onRetryPress={sign} description="There was an error signing the transaction." />
  }

  if (isError) {
    return <SignError onRetryPress={sign} />
  }

  if (isLoading || !data) {
    return <LoadingScreen title="Signing transaction..." description="It may take a few seconds..." />
  }

  return <SignSuccess />
}
