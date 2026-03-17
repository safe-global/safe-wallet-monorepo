import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppDispatch } from '@/src/store/hooks'
import { proposeSendTransaction } from '../services/proposeSendTransaction'
import logger from '@/src/utils/logger'

interface UseSendTransactionArgs {
  recipientAddress: string
  tokenAddress: string
  tokenAmount: string
  decimals: number
  isValid: boolean
  selectedNonce: number | undefined
  sender: string | undefined
}

interface UseSendTransactionResult {
  submitError: string | undefined
  handleReview: () => Promise<void>
  isSubmitting: boolean
}

export function useSendTransaction({
  recipientAddress,
  tokenAddress,
  tokenAmount,
  decimals,
  isValid,
  selectedNonce,
  sender,
}: UseSendTransactionArgs): UseSendTransactionResult {
  const router = useRouter()
  const activeSafe = useDefinedActiveSafe()
  const dispatch = useAppDispatch()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)
  const [submitError, setSubmitError] = useState<string>()

  const handleReview = useCallback(async () => {
    if (isSubmittingRef.current) {
      return
    }

    const cannotSubmit = !isValid || isSubmitting || !sender
    if (cannotSubmit) {
      return
    }
    isSubmittingRef.current = true
    setIsSubmitting(true)
    setSubmitError(undefined)

    try {
      const txId = await proposeSendTransaction({
        recipient: recipientAddress,
        tokenAddress: tokenAddress,
        amount: tokenAmount,
        decimals,
        chainId: activeSafe.chainId,
        safeAddress: activeSafe.address,
        sender,
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
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }, [
    isValid,
    isSubmitting,
    sender,
    recipientAddress,
    tokenAddress,
    tokenAmount,
    decimals,
    activeSafe,
    dispatch,
    router,
    selectedNonce,
  ])

  return { submitError, handleReview, isSubmitting }
}
