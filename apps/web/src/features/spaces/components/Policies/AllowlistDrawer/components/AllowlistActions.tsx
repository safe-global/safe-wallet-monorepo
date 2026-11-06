import type { ReactElement } from 'react'
import type { LinkProps } from 'next/link'
import { DrawerFooter } from '@/components/common/Drawer'
import { Button } from '@safe-global/views/components/ui/button'
import { DISCARD_LABEL } from '@safe-global/views/features/spaces/components/Policies/AllowlistDrawer/messages'
import type { AllowlistDrawerState } from '../resolveState'
import { PolicyDrawerActions } from '../../components/PolicyDrawerActions'
import { CopyTransactionLink } from '../../SpendingLimitDrawer/components/CopyTransactionLink'

export type AllowlistActionsProps = {
  state: AllowlistDrawerState
  onConnectWallet: () => void
  /** The edit and remove flows are not built yet; without a handler the button stays disabled. */
  onEdit?: () => void
  onRemove?: () => void
  /** Opens the apply flow once the guard's delay is over; without it the button stays disabled. */
  onApply?: () => void
  /** Drops an expired request; there is no discard flow yet, so without it the button stays disabled. */
  onDiscard?: () => void
  /** The disabled apply button's label while the delay runs, e.g. `Apply in 23 hours 59 minutes`. */
  applyLaterLabel?: string
  transactionLink?: string
  /** Absent until the transaction and chain configs have loaded. */
  reviewTransactionHref?: LinkProps['href']
}

const AllowlistActions = ({
  state,
  onConnectWallet,
  onEdit,
  onRemove,
  onApply,
  onDiscard,
  applyLaterLabel,
  transactionLink,
  reviewTransactionHref,
}: AllowlistActionsProps): ReactElement | null => {
  switch (state.action) {
    case 'connect':
      return <PolicyDrawerActions actionLabel="Connect wallet" onClick={onConnectWallet} hint={state.helper} />

    case 'manage':
      if (state.disabled) return <PolicyDrawerActions actionLabel="Edit" hint={state.helper} disabled />

      return (
        <DrawerFooter>
          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={onEdit} disabled={!onEdit}>
              Edit
            </Button>
            <Button variant="secondary" className="w-full" onClick={onRemove} disabled={!onRemove}>
              Remove
            </Button>
          </div>
        </DrawerFooter>
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
          href={reviewTransactionHref}
          disabled={!reviewTransactionHref}
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
