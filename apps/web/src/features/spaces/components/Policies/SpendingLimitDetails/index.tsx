import { useContext, type ReactElement } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { SpendingLimitDrawer, type ActiveDrawerPolicy } from '../SpendingLimitDrawer'
import type { PendingSpendingLimitPolicy } from '../types'
import { usePendingSpendingLimitActions } from './hooks/usePendingSpendingLimitActions'
import { useSpendingLimitDetails } from './hooks/useSpendingLimitDetails'

export type SpendingLimitDetailsProps = {
  policy: ActiveDrawerPolicy | PendingSpendingLimitPolicy
  isUnlisted?: boolean
  onClose: () => void
  /** Active policies only, and absent while the viewer may not edit: the footer renders `Edit` disabled. */
  onEdit?: () => void
}

const ActiveSpendingLimitDetails = ({
  policy,
  onClose,
  onEdit,
}: {
  policy: ActiveDrawerPolicy
  onClose: () => void
  onEdit?: () => void
}) => {
  const content = useSpendingLimitDetails(policy)
  const { txFlow } = useContext(TxModalContext)

  // Hidden rather than unmounted while the edit flow is open, so cancelling lands back on the panel.
  return <SpendingLimitDrawer open={!txFlow} onClose={onClose} policy={policy} {...content} onEdit={onEdit} />
}

const PendingSpendingLimitDetails = ({
  policy,
  isUnlisted,
  onClose,
}: {
  policy: PendingSpendingLimitPolicy
  isUnlisted?: boolean
  onClose: () => void
}) => {
  const content = useSpendingLimitDetails(policy)
  const pendingActions = usePendingSpendingLimitActions(policy, content.viewer, isUnlisted)
  const { txFlow } = useContext(TxModalContext)

  // The drawer's overlay sits above the tx modal, so it hides while the flow is open and stays mounted to catch the result.
  return <SpendingLimitDrawer open={!txFlow} onClose={onClose} {...content} {...pendingActions} />
}

/** Hooks cannot be conditional, so the queued-transaction reads live in their own component. */
const SpendingLimitDetails = ({ policy, isUnlisted, onClose, onEdit }: SpendingLimitDetailsProps): ReactElement =>
  policy.status === 'active' ? (
    <ActiveSpendingLimitDetails policy={policy} onClose={onClose} onEdit={onEdit} />
  ) : (
    <PendingSpendingLimitDetails policy={policy} isUnlisted={isUnlisted} onClose={onClose} />
  )

export default SpendingLimitDetails
