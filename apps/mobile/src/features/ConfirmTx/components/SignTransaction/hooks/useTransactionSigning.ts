import { useCallback, useRef, useState } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { RootState } from '@/src/store'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import { signTx } from '@/src/services/tx/tx-sender/sign'
import { useTransactionsAddConfirmationV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import logger from '@/src/utils/logger'
import { useGuard } from '@/src/context/GuardProvider'

export type SigningStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseTransactionSigningProps {
  txId: string
  signerAddress: string
}

export function useTransactionSigning({ txId, signerAddress }: UseTransactionSigningProps) {
  const [status, setStatus] = useState<SigningStatus>('idle')
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const { resetGuard } = useGuard()
  const hasTriggeredAutoSign = useRef(false)

  const [addConfirmation, { isLoading: isApiLoading, data: apiData, isError: isApiError }] =
    useTransactionsAddConfirmationV1Mutation()

  const executeSign = useCallback(async () => {
    if (hasTriggeredAutoSign.current) {
      return
    }

    setStatus('loading')
    hasTriggeredAutoSign.current = true

    try {
      const privateKey = await getPrivateKey(signerAddress)

      if (!privateKey) {
        setStatus('error')
        return
      }

      const signedTx = await signTx({
        chain: activeChain as ChainInfo,
        activeSafe,
        txId,
        privateKey,
      })

      await addConfirmation({
        chainId: activeSafe.chainId,
        safeTxHash: signedTx.safeTransactionHash,
        addConfirmationDto: {
          // TODO: we need to add this signature type in the auto generated types, because it was included recently in CGW
          // @ts-ignore
          signature: signedTx.signature,
        },
      })

      // CRITICAL: Reset guard immediately after successful signing
      resetGuard('signing')
      setStatus('success')
    } catch (error) {
      logger.error('Error signing transaction:', error)
      setStatus('error')
    }
  }, [activeChain, activeSafe, txId, signerAddress, addConfirmation, resetGuard])

  const retry = useCallback(() => {
    hasTriggeredAutoSign.current = false
    executeSign()
  }, [executeSign])

  const reset = useCallback(() => {
    setStatus('idle')
    hasTriggeredAutoSign.current = false
  }, [])

  return {
    status,
    executeSign,
    retry,
    reset,
    isApiLoading,
    apiData,
    isApiError,
    hasTriggeredAutoSign: hasTriggeredAutoSign.current,
  }
}
