import type { ReactElement } from 'react'
import { DrawerFooter } from '@/components/common/Drawer'
import CopyButton from '@/components/common/CopyButton'
import { Button } from '@/components/ui/button'
import { PolicyDrawerActions } from '../../../components/PolicyDrawerActions'
import type { SpendingLimitDrawerState } from '../../resolveState'

export type SpendingLimitActionsProps = {
  state: SpendingLimitDrawerState
  transactionLink: string
  onEdit: () => void
  onReviewTransaction: () => void
  onConnectWallet: () => void
}

const SpendingLimitActions = ({
  state,
  transactionLink,
  onEdit,
  onReviewTransaction,
  onConnectWallet,
}: SpendingLimitActionsProps): ReactElement => {
  if (state.action === 'connect') {
    return <PolicyDrawerActions actionLabel="Connect wallet" onClick={onConnectWallet} hint={state.helper} />
  }

  // Editing covers removal too: the edit flow can drop individual limits or all of them.
  if (state.kind === 'active') {
    return <PolicyDrawerActions actionLabel="Edit" onClick={onEdit} hint={state.helper} disabled={state.disabled} />
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
