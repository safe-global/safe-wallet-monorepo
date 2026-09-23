import type { ReactElement } from 'react'
import { DrawerFooter } from '@/components/common/Drawer'
import CopyButton from '@/components/common/CopyButton'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { PolicyDrawerActions } from '../../../components/PolicyDrawerActions'
import type { SpendingLimitDrawerState } from '../../resolveState'

export type SpendingLimitActionsProps = {
  state: SpendingLimitDrawerState
  transactionLink: string
  onEdit: () => void
  onDelete: () => void
  onReviewTransaction: () => void
  onConnectWallet: () => void
}

const SpendingLimitActions = ({
  state,
  transactionLink,
  onEdit,
  onDelete,
  onReviewTransaction,
  onConnectWallet,
}: SpendingLimitActionsProps): ReactElement => {
  if (state.action === 'connect') {
    return <PolicyDrawerActions actionLabel="Connect wallet" onClick={onConnectWallet} hint={state.helper} />
  }

  if (state.kind === 'active') {
    return (
      <DrawerFooter>
        <div className="flex flex-col gap-2">
          {state.helper && (
            <Typography variant="paragraph-mini" color="muted" align="center">
              {state.helper}
            </Typography>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onDelete} disabled={state.disabled}>
              Delete
            </Button>
            <Button className="flex-1" onClick={onEdit} disabled={state.disabled}>
              Edit
            </Button>
          </div>
        </div>
      </DrawerFooter>
    )
  }

  switch (state.action) {
    case 'review':
      return <PolicyDrawerActions actionLabel="Review transaction" onClick={onReviewTransaction} />

    case 'copy-link':
      return (
        <DrawerFooter>
          <div className="flex *:w-full">
            <CopyButton text={transactionLink} initialToolTipText="Copy transaction link">
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
