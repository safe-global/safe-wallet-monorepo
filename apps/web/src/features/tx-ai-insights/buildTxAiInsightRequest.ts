import type { SafeTransaction } from '@safe-global/types-kit'
import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { TxAiInsightRequest } from './types'

/**
 * Builds the backend request payload from the live safeTx and its decoded preview. Pure function
 * so it can be unit-tested without React.
 */
export const buildTxAiInsightRequest = ({
  chainId,
  safeAddress,
  safeTxHash,
  safeTxData,
  txPreview,
}: {
  chainId: string
  safeAddress: string
  safeTxHash: string
  safeTxData: SafeTransaction['data']
  txPreview?: TransactionPreview
}): TxAiInsightRequest => {
  const dataDecoded = txPreview?.txData?.dataDecoded

  return {
    chainId,
    safeAddress,
    safeTxHash,
    nonce: Number(safeTxData.nonce),
    transaction: {
      to: safeTxData.to,
      value: safeTxData.value,
      data: safeTxData.data,
      operation: Number(safeTxData.operation),
    },
    decoded: dataDecoded ? { method: dataDecoded.method, parameters: dataDecoded.parameters } : null,
  }
}
