import { useCallback, useRef, useState } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { RootState } from '@/src/store'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import { signTx } from '@/src/services/tx/tx-sender/sign'
import { useTransactionsAddConfirmationV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import logger from '@/src/utils/logger'
import { useGuard } from '@/src/context/GuardProvider'

export enum SigningStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

interface UseTransactionSigningProps {
  txId: string
  signerAddress: string
}

export function useTransactionSigning({ txId, signerAddress }: UseTransactionSigningProps) {
  const [status, setStatus] = useState<SigningStatus>(SigningStatus.IDLE)
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

    setStatus(SigningStatus.LOADING)
    hasTriggeredAutoSign.current = true

    let privateKey
    try {
      privateKey = await getPrivateKey(signerAddress)
    } catch (error) {
      logger.error('Error loading private key:', error)
      setStatus(SigningStatus.ERROR)
    }

    try {
      if (!privateKey) {
        setStatus(SigningStatus.ERROR)
        return
      }

      const signedTx = await signTx({
        chain: activeChain,
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
      setStatus(SigningStatus.SUCCESS)
    } catch (error) {
      logger.error('Error signing transaction:', error)
      setStatus(SigningStatus.ERROR)
    }
  }, [activeChain, activeSafe, txId, signerAddress, addConfirmation, resetGuard])

  const retry = useCallback(() => {
    hasTriggeredAutoSign.current = false
    executeSign()
  }, [executeSign])

  const reset = useCallback(() => {
    setStatus(SigningStatus.IDLE)
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
