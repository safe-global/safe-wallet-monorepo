import type { ReactElement } from 'react'
import { SpendingLimitDrawer, type ActiveDrawerPolicy } from '../SpendingLimitDrawer'
import { useSpendingLimitDetails } from './hooks/useSpendingLimitDetails'

export type SpendingLimitDetailsProps = {
  policy: ActiveDrawerPolicy
  onClose: () => void
}

const SpendingLimitDetails = ({ policy, onClose }: SpendingLimitDetailsProps): ReactElement => {
  const content = useSpendingLimitDetails(policy)

  return <SpendingLimitDrawer open onClose={onClose} policy={policy} {...content} />
}

export default SpendingLimitDetails
