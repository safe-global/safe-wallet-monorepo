import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { proposeSendTransaction } from '../services/proposeSendTransaction'
import logger from '@/src/utils/logger'

interface UseSendTransactionArgs {
  recipientAddress: string
  tokenAddress: string
  tokenAmount: string
  decimals: number
  isValid: boolean
  selectedNonce: number | undefined
}

interface UseSendTransactionResult {
  submitError: string | undefined
  activeSigner: ReturnType<typeof selectActiveSigner>
  handleReview: () => Promise<void>
  isSubmitting: React.RefObject<boolean>
}

export function useSendTransaction({
  recipientAddress,
  tokenAddress,
  tokenAmount,
  decimals,
  isValid,
  selectedNonce,
}: UseSendTransactionArgs): UseSendTransactionResult {
  const router = useRouter()
  const activeSafe = useDefinedActiveSafe()
  const dispatch = useAppDispatch()
  const activeSigner = useAppSelector((state) => selectActiveSigner(state, activeSafe.address))
  const isSubmitting = useRef(false)
  const [submitError, setSubmitError] = useState<string>()

  const handleReview = useCallback(async () => {
    if (!isValid || isSubmitting.current || !activeSigner) {
      return
    }
    isSubmitting.current = true
    setSubmitError(undefined)

    try {
      const txId = await proposeSendTransaction({
        recipient: recipientAddress ?? '',
        tokenAddress: tokenAddress ?? '',
        amount: tokenAmount,
        decimals,
        chainId: activeSafe.chainId,
        safeAddress: activeSafe.address,
        sender: activeSigner.value,
        dispatch,
        nonce: selectedNonce,
      })

      router.push({
        pathname: '/confirm-transaction',
        params: { txId },
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create transaction'
      logger.error('Send transaction proposal failed:', e)
      setSubmitError(message)
    } finally {
      isSubmitting.current = false
    }
  }, [
    isValid,
    activeSigner,
    recipientAddress,
    tokenAddress,
    tokenAmount,
    decimals,
    activeSafe,
    dispatch,
    router,
    selectedNonce,
  ])

  return { submitError, activeSigner, handleReview, isSubmitting }
}
