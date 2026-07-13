import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppDispatch } from '@/src/store/hooks'
import useSafeInfo from '@/src/hooks/useSafeInfo'
import { prepareSendDraft } from '../services/prepareSendDraft'
import logger from '@/src/utils/logger'

interface UseSendTransactionArgs {
  recipientAddress: string
  tokenAddress: string
  tokenAmount: string
  decimals: number
  isValid: boolean
  selectedNonce: number | undefined
  hasSigner: boolean
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
  hasSigner,
}: UseSendTransactionArgs): UseSendTransactionResult {
  const router = useRouter()
  const activeSafe = useDefinedActiveSafe()
  const { safe } = useSafeInfo()
  const dispatch = useAppDispatch()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)
  const [submitError, setSubmitError] = useState<string>()

  const handleReview = useCallback(async () => {
    if (isSubmittingRef.current) {
      return
    }

    if (!isValid || !hasSigner) {
      return
    }
    isSubmittingRef.current = true
    setIsSubmitting(true)
    setSubmitError(undefined)

    try {
      const safeTxHash = await prepareSendDraft({
        recipient: recipientAddress,
        tokenAddress: tokenAddress,
        amount: tokenAmount,
        decimals,
        chainId: activeSafe.chainId,
        safeAddress: activeSafe.address,
        dispatch,
        nonce: selectedNonce,
        safe,
      })

      router.push({
        pathname: '/confirm-transaction',
        params: { txId: safeTxHash },
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create transaction'
      logger.error('Send transaction preview failed:', e)
      setSubmitError(message)
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }, [
    isValid,
    hasSigner,
    recipientAddress,
    tokenAddress,
    tokenAmount,
    decimals,
    activeSafe,
    safe,
    dispatch,
    router,
    selectedNonce,
  ])

  return { submitError, handleReview, isSubmitting }
}
