/**
 * Custom hook for transaction-related analytics
 * Provides convenient methods for tracking transaction events
 */
import { useCallback } from 'react'
import { useAnalytics, EVENT } from '@/services/analytics'
import useSafeAddress from '@/hooks/useSafeAddress'
import useChainId from '@/hooks/useChainId'

export interface TransactionAnalyticsParams {
  txType: string
  amount?: string
  asset?: string
  creationMethod?: 'standard' | 'via_role' | 'via_spending_limit' | 'via_proposer' | 'via_parent'
  confirmationMethod?: 'standard' | 'via_parent' | 'in_parent'
  executionMethod?: 'standard' | 'speed_up' | 'via_spending_limit' | 'via_role' | 'via_parent' | 'in_parent'
}

export const useTransactionAnalytics = () => {
  const { track } = useAnalytics()
  const safeAddress = useSafeAddress()
  const chainId = useChainId()

  const trackTransactionCreated = useCallback((params: TransactionAnalyticsParams) => {
    track({
      name: EVENT.TransactionCreated,
      payload: {
        tx_type: params.txType as any,
        safe_address: safeAddress || '',
        chain_id: chainId?.toString() || '',
        amount: params.amount,
        asset: params.asset,
        creation_method: params.creationMethod || 'standard',
      },
    })
  }, [track, safeAddress, chainId])

  const trackTransactionConfirmed = useCallback((params: TransactionAnalyticsParams) => {
    track({
      name: EVENT.TransactionConfirmed,
      payload: {
        tx_type: params.txType,
        safe_address: safeAddress || '',
        chain_id: chainId?.toString() || '',
        confirmation_method: params.confirmationMethod || 'standard',
      },
    })
  }, [track, safeAddress, chainId])

  const trackTransactionExecuted = useCallback((params: TransactionAnalyticsParams) => {
    track({
      name: EVENT.TransactionExecuted,
      payload: {
        tx_type: params.txType,
        safe_address: safeAddress || '',
        chain_id: chainId?.toString() || '',
        execution_method: params.executionMethod || 'standard',
      },
    })
  }, [track, safeAddress, chainId])

  // Convenience methods for common transaction types
  const trackTokenTransfer = useCallback((amount: string, asset: string) => {
    trackTransactionCreated({
      txType: 'transfer_token',
      amount,
      asset,
    })
  }, [trackTransactionCreated])

  const trackNftTransfer = useCallback((tokenId: string, contractAddress: string) => {
    trackTransactionCreated({
      txType: 'transfer_nft',
      asset: contractAddress,
      amount: tokenId,
    })
  }, [trackTransactionCreated])

  const trackBatchTransaction = useCallback((txCount: number) => {
    trackTransactionCreated({
      txType: 'batch',
      amount: txCount.toString(),
    })
  }, [trackTransactionCreated])

  const trackSwapTransaction = useCallback((inputAmount: string, inputToken: string, outputToken: string) => {
    trackTransactionCreated({
      txType: 'native_swap',
      amount: inputAmount,
      asset: `${inputToken}-${outputToken}`,
    })
  }, [trackTransactionCreated])

  const trackSpeedUpTransaction = useCallback((txType: string) => {
    trackTransactionExecuted({
      txType,
      executionMethod: 'speed_up',
    })
  }, [trackTransactionExecuted])

  return {
    trackTransactionCreated,
    trackTransactionConfirmed,
    trackTransactionExecuted,
    trackTokenTransfer,
    trackNftTransfer,
    trackBatchTransaction,
    trackSwapTransaction,
    trackSpeedUpTransaction,
  }
}