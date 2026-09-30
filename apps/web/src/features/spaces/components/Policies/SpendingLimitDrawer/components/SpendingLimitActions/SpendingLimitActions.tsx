import type { ReactElement } from 'react'
import { PolicyDrawerActions } from '../../../components/PolicyDrawerActions'
import { EDIT_UNAVAILABLE_HELPER, TX_LOAD_FAILED_HELPER } from '../../copy'
import type { SpendingLimitDrawerState } from '../../resolveState'
import { CopyTransactionLink } from '../CopyTransactionLink'

type PendingSpendingLimitActions = {
  transactionLink?: string
  /** Absent until the queued transaction has loaded: the flow needs its summary. */
  onReviewTransaction?: () => void
  /** Set when the queued transaction failed to load. */
  onRetry?: () => void
}

export type SpendingLimitActionsProps = {
  state: SpendingLimitDrawerState
  onConnectWallet: () => void
  onEdit?: () => void
  pending?: PendingSpendingLimitActions
}

const SpendingLimitActions = ({
  state,
  onConnectWallet,
  onEdit,
  pending,
}: SpendingLimitActionsProps): ReactElement | null => {
  switch (state.action) {
    case 'connect':
      return <PolicyDrawerActions actionLabel="Connect wallet" onClick={onConnectWallet} hint={state.helper} />

    // Editing covers removal too: the edit flow can drop individual limits or all of them.
    case 'manage':
      return (
        <PolicyDrawerActions
          actionLabel="Edit"
          onClick={onEdit}
          hint={state.helper ?? (onEdit ? undefined : EDIT_UNAVAILABLE_HELPER)}
          disabled={state.disabled || !onEdit}
        />
      )

    case 'review':
      if (pending?.onRetry) {
        return <PolicyDrawerActions actionLabel="Try again" onClick={pending.onRetry} hint={TX_LOAD_FAILED_HELPER} />
      }

      return pending ? (
        <PolicyDrawerActions
          actionLabel="Review transaction"
          onClick={pending.onReviewTransaction}
          disabled={!pending.onReviewTransaction}
        />
      ) : null

    case 'copy-link':
      return pending?.transactionLink ? <CopyTransactionLink transactionLink={pending.transactionLink} /> : null

    case 'none':
      return null

    // A new action must pick a branch above rather than silently rendering nothing.
    default: {
      const exhaustive: never = state
      return exhaustive
    }
  }
}

export default SpendingLimitActions
