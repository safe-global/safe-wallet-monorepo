import type { ReactElement } from 'react'
import { DrawerFooter } from '@/components/common/Drawer'
import { Button } from '@safe-global/views/components/ui/button'
import { EDIT_LABEL } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import {
  DISCARD_LABEL,
  REMOVE_GUARD_LABEL,
} from '@safe-global/views/features/spaces/components/Policies/AllowlistDrawer/messages'
import type { AllowlistDrawerState } from '../resolveState'
import { PolicyDrawerActions } from '../../components/PolicyDrawerActions'
import { CopyTransactionLink } from '../../SpendingLimitDrawer/components/CopyTransactionLink'

export type AllowlistActionsProps = {
  state: AllowlistDrawerState
  onConnectWallet: () => void
  /** Opens the edit flow; without it the button stays disabled. */
  onEdit?: () => void
  /** Requests the removal; without it the button stays disabled. */
  onRemove?: () => void
  /** Takes the guard off once a removal is applied; without it the button stays disabled. */
  onRemoveGuard?: () => void
  /** Opens the apply flow once the guard's delay is over; without it the button stays disabled. */
  onApply?: () => void
  /** Drops an expired request; there is no discard flow yet, so without it the button stays disabled. */
  onDiscard?: () => void
  /** The disabled apply button's label while the delay runs, e.g. `Apply in 23 hours 59 minutes`. */
  applyLaterLabel?: string
  transactionLink?: string
  /** Opens the queued transaction's review; absent until the transaction has loaded. */
  onReviewTransaction?: () => void
}

const AllowlistActions = ({
  state,
  onConnectWallet,
  onEdit,
  onRemove,
  onRemoveGuard,
  onApply,
  onDiscard,
  applyLaterLabel,
  transactionLink,
  onReviewTransaction,
}: AllowlistActionsProps): ReactElement | null => {
  switch (state.action) {
    case 'connect':
      return <PolicyDrawerActions actionLabel="Connect wallet" onClick={onConnectWallet} hint={state.helper} />

    // A non-signer can do neither, so only the primary action shows, disabled with the reason.
    case 'manage':
      if (state.disabled) return <PolicyDrawerActions actionLabel={EDIT_LABEL} hint={state.helper} disabled />

      return (
        <DrawerFooter>
          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={onEdit} disabled={!onEdit}>
              {EDIT_LABEL}
            </Button>
            <Button variant="secondary" className="w-full" onClick={onRemove} disabled={!onRemove}>
              Remove
            </Button>
          </div>
        </DrawerFooter>
      )

    case 'remove-guard':
      return (
        <PolicyDrawerActions
          actionLabel={REMOVE_GUARD_LABEL}
          onClick={onRemoveGuard}
          hint={state.helper}
          disabled={state.disabled || !onRemoveGuard}
        />
      )

    case 'discard':
      return (
        <PolicyDrawerActions
          actionLabel={DISCARD_LABEL}
          onClick={onDiscard}
          hint={state.helper}
          disabled={!onDiscard}
        />
      )

    case 'apply':
      return (
        <PolicyDrawerActions
          actionLabel="Review transaction"
          onClick={onApply}
          hint={state.helper}
          disabled={state.disabled || !onApply}
        />
      )

    case 'apply-later':
      return <PolicyDrawerActions actionLabel={applyLaterLabel ?? 'Apply'} disabled />

    case 'review':
      return (
        <PolicyDrawerActions
          actionLabel="Review transaction"
          onClick={onReviewTransaction}
          disabled={!onReviewTransaction}
        />
      )

    case 'copy-link':
      return transactionLink ? <CopyTransactionLink transactionLink={transactionLink} /> : null

    case 'none':
      return null

    // A new action must pick a branch above rather than silently rendering nothing.
    default: {
      const exhaustive: never = state
      return exhaustive
    }
  }
}

export default AllowlistActions
