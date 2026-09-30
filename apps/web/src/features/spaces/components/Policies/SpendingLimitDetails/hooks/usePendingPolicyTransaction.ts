import { useEffect, useMemo, useState } from 'react'
import {
  useTransactionsGetTransactionByIdV1Query,
  type Transaction,
  type TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { POLLING_INTERVAL } from '@/config/constants'
import { TxEvent } from '@/services/tx/txEvents'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { makeTxFromDetails } from '@/utils/transactions'
import type { PendingTxOutcome } from '../../SpendingLimitDrawer'
import { useRefetchOnTxEvents } from '../../hooks/useRefetchOnTxEvents'
import type { PendingSpendingLimitPolicy } from '../../types'
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
  /** Set when loading failed, unless a 404 confirms the transaction was deleted. */
  onRetry?: () => void
}

export const usePendingPolicyTransaction = (
  policy: PendingSpendingLimitPolicy,
  isUnlisted = false,
): PendingPolicyTransaction => {
  // A transaction that has left the queue can no longer change.
  const [isSettled, setIsSettled] = useState(false)
  const { currentData, error, refetch } = useTransactionsGetTransactionByIdV1Query(
    { chainId: policy.safe.chainId, id: getPendingTxId(policy) },
    // Another signer executing, deleting or replacing it sends no event to this tab.
    {
      refetchOnFocus: !isSettled,
      pollingInterval: isSettled ? 0 : POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
    },
  )

  useRefetchOnTxEvents(REFETCH_EVENTS, refetch, !isSettled)

  useEffect(() => {
    if (isUnlisted) refetch()
  }, [isUnlisted, refetch])

  const transaction = useMemo<PendingPolicyTransaction>(() => {
    // A 404 while the row is still listed may be CGW lagging, so only the list leaving confirms a deletion.
    if (isUnlisted && error && 'status' in error && error.status === 404) return { confirmedBy: [], outcome: 'deleted' }
    if (!currentData) return error ? { confirmedBy: [], onRetry: refetch } : { confirmedBy: [] }

    const execution = isMultisigDetailedExecutionInfo(currentData.detailedExecutionInfo)
      ? currentData.detailedExecutionInfo
      : undefined

    return {
      txSummary: makeTxFromDetails(currentData).transaction,
      confirmedBy: execution?.confirmations.map(({ signer }) => signer.value) ?? [],
      confirmationsSubmitted: execution?.confirmations.length,
      outcome: OUTCOME_BY_STATUS[currentData.txStatus],
    }
  }, [currentData, error, isUnlisted, refetch])

  useEffect(() => {
    setIsSettled(Boolean(transaction.outcome))
  }, [transaction.outcome])

  return transaction
}
