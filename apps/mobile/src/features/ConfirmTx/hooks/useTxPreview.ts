import { useEffect } from 'react'
import {
  useTransactionsPreviewTransactionV1Mutation,
  type Operation,
  type TransactionPreview,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SafeTransaction } from '@safe-global/types-kit'

interface PreviewInput {
  chainId: string
  safeAddress: string
  txData: {
    operation: SafeTransaction['data']['operation']
    data: SafeTransaction['data']['data']
    value: SafeTransaction['data']['value']
    to: SafeTransaction['data']['to']
  }
}

interface PreviewResult {
  txPreview?: TransactionPreview
  error?: Error
  isLoading: boolean
}

/**
 * Fetches a CGW transaction preview for a locally composed (un-proposed)
 * transaction. Mirrors the web app's `useTxPreview` so both clients
 * surface the same decoded-info view during compose.
 *
 * Re-fires on dependency change (same behaviour as web). Callers that
 * need persistence across screen re-mounts should snapshot the result
 * into `draftTxSlice`.
 */
export const useTxPreview = (input: PreviewInput | undefined): PreviewResult => {
  const [triggerPreview, { data: txPreview, error, isLoading }] = useTransactionsPreviewTransactionV1Mutation()

  useEffect(() => {
    if (!input) {
      return
    }

    const { chainId, safeAddress, txData } = input
    triggerPreview({
      chainId,
      safeAddress,
      previewTransactionDto: {
        to: txData.to || '',
        data: txData.data || null,
        value: txData.value || '0',
        operation: (txData.operation ?? 0) as Operation,
      },
    })
  }, [input, triggerPreview])

  return {
    txPreview,
    error: error as Error | undefined,
    isLoading,
  }
}
