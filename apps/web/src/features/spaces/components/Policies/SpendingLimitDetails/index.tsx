import type { ReactElement } from 'react'
import { SpendingLimitDrawer, type ActiveDrawerPolicy } from '../SpendingLimitDrawer'
import { useSpendingLimitDetails } from './hooks/useSpendingLimitDetails'

export type SpendingLimitDetailsProps = {
  policy: ActiveDrawerPolicy
  onClose: () => void
  /** Absent while the viewer may not edit: the footer then renders `Edit` disabled. */
  onEdit?: () => void
}

const SpendingLimitDetails = ({ policy, onClose, onEdit }: SpendingLimitDetailsProps): ReactElement => {
  const content = useSpendingLimitDetails(policy)

  return <SpendingLimitDrawer open onClose={onClose} policy={policy} onEdit={onEdit} {...content} />
}

export default SpendingLimitDetails
