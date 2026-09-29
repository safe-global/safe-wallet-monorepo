import type { ReactElement } from 'react'
import { PolicyDrawerActions } from '../../../components/PolicyDrawerActions'
import { EDIT_UNAVAILABLE_HELPER } from '../../copy'
import type { SpendingLimitDrawerState } from '../../resolveState'
import { CopyTransactionLink } from '../CopyTransactionLink'

type PendingSpendingLimitActions = {
  transactionLink: string
  onReviewTransaction: () => void
}

export type SpendingLimitActionsProps = {
  state: SpendingLimitDrawerState
  onConnectWallet: () => void
  /** Absent until WA-3156 ships the edit flow, which leaves the button disabled. */
  onEdit?: () => void
  /** Supplied only for a queued policy, whose footer signs or shares the transaction instead. */
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
      return pending ? (
        <PolicyDrawerActions actionLabel="Review transaction" onClick={pending.onReviewTransaction} />
      ) : null

    case 'copy-link':
      return pending ? <CopyTransactionLink transactionLink={pending.transactionLink} /> : null

    // A new action must pick a branch above rather than silently rendering nothing.
    default: {
      const exhaustive: never = state
      return exhaustive
    }
  }
}

export default SpendingLimitActions
