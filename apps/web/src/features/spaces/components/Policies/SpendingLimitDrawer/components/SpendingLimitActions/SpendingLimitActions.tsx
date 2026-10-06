import type { ReactElement } from 'react'
import type { LinkProps } from 'next/link'
import { PolicyDrawerActions } from '../../../components/PolicyDrawerActions'
import { EDIT_LOCKED_HELPER, TX_LOAD_FAILED_HELPER } from '../../messages'
import type { SpendingLimitDrawerState } from '../../resolveState'
import { CopyTransactionLink } from '../CopyTransactionLink'

type PendingSpendingLimitActions = {
  transactionLink?: string
  /** Absent until the transaction and chain configs have loaded, or once the row has left the list. */
  reviewTransactionHref?: LinkProps['href']
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
          hint={state.helper ?? (onEdit ? undefined : EDIT_LOCKED_HELPER)}
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
          href={pending.reviewTransactionHref}
          disabled={!pending.reviewTransactionHref}
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
