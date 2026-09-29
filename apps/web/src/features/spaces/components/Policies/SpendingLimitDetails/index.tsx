import type { ReactElement } from 'react'
import { SpendingLimitDrawer, type ActiveDrawerPolicy } from '../SpendingLimitDrawer'
import type { QueuedSpendingLimitPolicy } from '../types'
import { usePendingSpendingLimitActions } from './hooks/usePendingSpendingLimitActions'
import { useSpendingLimitDetails } from './hooks/useSpendingLimitDetails'

export type SpendingLimitDetailsProps = {
  policy: ActiveDrawerPolicy | QueuedSpendingLimitPolicy
  onClose: () => void
}

const ActiveSpendingLimitDetails = ({ policy, onClose }: { policy: ActiveDrawerPolicy; onClose: () => void }) => {
  const content = useSpendingLimitDetails(policy)

  return <SpendingLimitDrawer open onClose={onClose} policy={policy} {...content} />
}

const PendingSpendingLimitDetails = ({
  policy,
  onClose,
}: {
  policy: QueuedSpendingLimitPolicy
  onClose: () => void
}) => {
  const content = useSpendingLimitDetails(policy)
  const pending = usePendingSpendingLimitActions(policy, content.viewer)

  return <SpendingLimitDrawer open onClose={onClose} {...content} {...pending} />
}

/** Hooks cannot be conditional, so the queued-transaction reads live in their own component. */
const SpendingLimitDetails = ({ policy, onClose }: SpendingLimitDetailsProps): ReactElement =>
  policy.status === 'pending' ? (
    <PendingSpendingLimitDetails policy={policy} onClose={onClose} />
  ) : (
    <ActiveSpendingLimitDetails policy={policy} onClose={onClose} />
  )

export default SpendingLimitDetails
