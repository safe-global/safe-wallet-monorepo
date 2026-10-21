import type { ReactElement } from 'react'
import type { LinkProps } from 'next/link'
import { DrawerFooter } from '@/components/common/Drawer'
import { Button } from '@safe-global/views/components/ui/button'
import type { AllowlistDrawerState } from '@safe-global/views/features/spaces/components/Policies/AllowlistDrawer/resolveState'
import { PolicyDrawerActions } from '../../components/PolicyDrawerActions'
import { CopyTransactionLink } from '../../SpendingLimitDrawer/components/CopyTransactionLink'

export type AllowlistActionsProps = {
  state: AllowlistDrawerState
  onConnectWallet: () => void
  /** The edit and remove flows are not built yet; without a handler the button stays disabled. */
  onEdit?: () => void
  onRemove?: () => void
  onCancelChange?: () => void
  transactionLink?: string
  /** Absent until the transaction and chain configs have loaded. */
  reviewTransactionHref?: LinkProps['href']
}

const AllowlistActions = ({
  state,
  onConnectWallet,
  onEdit,
  onRemove,
  onCancelChange,
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

    case 'cancel':
      return (
        <PolicyDrawerActions
          actionLabel="Cancel change"
          variant="secondary"
          onClick={onCancelChange}
          hint={state.helper}
          disabled={state.disabled || !onCancelChange}
        />
      )

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
