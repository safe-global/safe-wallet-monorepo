import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { PendingTxOutcome } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/resolveState'

/** What CGW's status of a queued policy transaction means for its row; a status left out is still queued. */
export const PENDING_TX_OUTCOME_BY_STATUS: Partial<Record<TransactionDetails['txStatus'], PendingTxOutcome>> = {
  SUCCESS: 'executed',
  FAILED: 'failed',
  // CGW marks a queued transaction cancelled once another one has taken its nonce.
  CANCELLED: 'replaced',
}
