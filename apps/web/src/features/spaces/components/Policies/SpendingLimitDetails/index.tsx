import { useContext, type ReactElement } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { SpendingLimitDrawer, type ActiveDrawerPolicy } from '../SpendingLimitDrawer'
import type { PendingSpendingLimitPolicy } from '../types'
import { usePendingSpendingLimitActions } from './hooks/usePendingSpendingLimitActions'
import { useSpendingLimitDetails } from './hooks/useSpendingLimitDetails'

export type SpendingLimitDetailsProps = {
  policy: ActiveDrawerPolicy | PendingSpendingLimitPolicy
  /** The pending row is gone from the list, so the panel shows a copy until it learns why. */
  hasLeftQueue?: boolean
  onClose: () => void
}

const ActiveSpendingLimitDetails = ({ policy, onClose }: { policy: ActiveDrawerPolicy; onClose: () => void }) => {
  const content = useSpendingLimitDetails(policy)

  return <SpendingLimitDrawer open onClose={onClose} policy={policy} {...content} />
}

const PendingSpendingLimitDetails = ({
  policy,
  hasLeftQueue,
  onClose,
}: {
  policy: PendingSpendingLimitPolicy
  hasLeftQueue?: boolean
  onClose: () => void
}) => {
  const content = useSpendingLimitDetails(policy)
  const pending = usePendingSpendingLimitActions(policy, content.viewer, hasLeftQueue)
  const { txFlow } = useContext(TxModalContext)

  // The drawer's overlay sits above the tx modal, so it hides while the flow is open and stays mounted to catch the result.
  return <SpendingLimitDrawer open={!txFlow} onClose={onClose} {...content} {...pending} />
}

/** Hooks cannot be conditional, so the queued-transaction reads live in their own component. */
const SpendingLimitDetails = ({ policy, hasLeftQueue, onClose }: SpendingLimitDetailsProps): ReactElement =>
  policy.status === 'active' ? (
    <ActiveSpendingLimitDetails policy={policy} onClose={onClose} />
  ) : (
    <PendingSpendingLimitDetails policy={policy} hasLeftQueue={hasLeftQueue} onClose={onClose} />
  )

export default SpendingLimitDetails
