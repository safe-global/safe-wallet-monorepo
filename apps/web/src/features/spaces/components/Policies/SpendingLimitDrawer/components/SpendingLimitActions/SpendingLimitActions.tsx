import type { ReactElement } from 'react'
import { DrawerFooter } from '@/components/common/Drawer'
import CopyButton from '@/components/common/CopyButton'
import { Button } from '@/components/ui/button'
import { PolicyDrawerActions } from '../../../components/PolicyDrawerActions'
import { EDIT_UNAVAILABLE_HELPER } from '../../copy'
import type { SpendingLimitDrawerState } from '../../resolveState'

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
  if (state.action === 'connect') {
    return <PolicyDrawerActions actionLabel="Connect wallet" onClick={onConnectWallet} hint={state.helper} />
  }

  // Editing covers removal too: the edit flow can drop individual limits or all of them.
  if (state.kind !== 'pending') {
    return (
      <PolicyDrawerActions
        actionLabel="Edit"
        onClick={onEdit}
        hint={state.helper ?? (onEdit ? undefined : EDIT_UNAVAILABLE_HELPER)}
        disabled={state.disabled || !onEdit}
      />
    )
  }

  if (!pending) return null

  switch (state.action) {
    case 'review':
      return <PolicyDrawerActions actionLabel="Review transaction" onClick={pending.onReviewTransaction} />

    case 'copy-link':
      return (
        <DrawerFooter>
          <div className="flex *:w-full">
            <CopyButton text={pending.transactionLink} initialToolTipText="Copy transaction link">
              <Button className="w-full">Copy transaction link</Button>
            </CopyButton>
          </div>
        </DrawerFooter>
      )

    // A new pending action must pick a branch above rather than silently rendering a copy button.
    default: {
      const exhaustive: never = state.action
      return exhaustive
    }
  }
}

export default SpendingLimitActions
