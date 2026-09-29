import { useMemo } from 'react'
import {
  useTransactionsGetTransactionByIdV1Query,
  type Transaction,
  type TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TxEvent } from '@/services/tx/txEvents'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { makeTxFromDetails } from '@/utils/transactions'
import type { PendingTxOutcome } from '../../SpendingLimitDrawer'
import { useRefetchOnTxEvents } from '../../hooks/useRefetchOnTxEvents'
import type { QueuedSpendingLimitPolicy } from '../../types'
import { getPendingTxId } from '../../utils/mapPendingPolicies'

const REFETCH_EVENTS = [
  TxEvent.SIGNATURE_PROPOSED,
  TxEvent.ONCHAIN_SIGNATURE_SUCCESS,
  TxEvent.PROCESSED,
  TxEvent.SUCCESS,
  TxEvent.DELETED,
]

const OUTCOME_BY_STATUS: Partial<Record<TransactionDetails['txStatus'], PendingTxOutcome>> = {
  SUCCESS: 'executed',
  FAILED: 'failed',
  // CGW marks a queued transaction cancelled once another one has taken its nonce.
  CANCELLED: 'replaced',
}

export type PendingPolicyTransaction = {
  /** Undefined until loaded; the review flow needs it. */
  txSummary?: Transaction
  /** Addresses that have confirmed. Empty until loaded. */
  confirmedBy: string[]
  /** Fresher than the pending DTO, which CGW caches separately. */
  confirmationsSubmitted?: number
  outcome?: PendingTxOutcome
}

export const usePendingPolicyTransaction = (policy: QueuedSpendingLimitPolicy): PendingPolicyTransaction => {
  const { currentData, error, refetch } = useTransactionsGetTransactionByIdV1Query(
    { chainId: policy.safe.chainId, id: getPendingTxId(policy) },
    { refetchOnFocus: true },
  )

  useRefetchOnTxEvents(REFETCH_EVENTS, refetch, true)

  return useMemo<PendingPolicyTransaction>(() => {
    if (error && 'status' in error && error.status === 404) return { confirmedBy: [], outcome: 'deleted' }
    if (!currentData) return { confirmedBy: [] }

    const execution = isMultisigDetailedExecutionInfo(currentData.detailedExecutionInfo)
      ? currentData.detailedExecutionInfo
      : undefined

    return {
      txSummary: makeTxFromDetails(currentData).transaction,
      confirmedBy: execution?.confirmations.map(({ signer }) => signer.value) ?? [],
      confirmationsSubmitted: execution?.confirmations.length,
      outcome: OUTCOME_BY_STATUS[currentData.txStatus],
    }
  }, [currentData, error])
}
