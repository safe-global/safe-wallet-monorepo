import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { FeeRow } from './useFeesPreview'

export type HistoryFeesData = {
  totalFee: { amount: string; currency: string; fiatAmount?: string }
  executionFee: FeeRow
  gasFee: FeeRow
}

/**
 * Provides fee breakdown data for historical transactions.
 * Returns mock data until CGW provides fee breakdown fields on historical tx responses.
 * No fee computation on the frontend — all values come from CGW (or mock).
 */
export const useHistoryFeesBreakdown = (txDetails: TransactionDetails): HistoryFeesData | null => {
  const isGtfEnabled = useHasFeature(FEATURES.GTF)

  if (!isGtfEnabled) return null
  // Unexecuted txs (confirmation flow) render FeesPreview with live data instead.
  if (!txDetails.executedAt) return null
  if (!txDetails.detailedExecutionInfo) return null
  if (!isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) return null

  // TODO: Replace mock data with CGW-provided fee breakdown fields
  // when GET /v1/chains/{chain}/transactions/{id} returns them.
  // The frontend must NOT compute fees — only render what CGW returns.
  return {
    totalFee: {
      amount: '0.005',
      currency: 'ETH',
      fiatAmount: '$15.12',
    },
    executionFee: {
      label: 'Execution fee (0.5%)',
      amount: '0.002730',
      currency: 'ETH',
      isFree: true,
    },
    gasFee: {
      label: 'Gas fee',
      amount: '0.005',
      currency: 'ETH',
      fiatAmount: '$15.12',
    },
  }
}
