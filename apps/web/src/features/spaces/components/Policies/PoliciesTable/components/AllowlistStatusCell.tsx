import type { ReactElement } from 'react'
import PolicyStatusCell from '@safe-global/views/features/spaces/components/Policies/PoliciesTable/components/PolicyStatusCell'
import type { AllowlistRow } from '../../utils/allowlistStatus'
import { useAllowlistStatus } from '../../hooks/useAllowlistStatus'

const AllowlistStatusCell = ({ policy }: { policy: AllowlistRow }): ReactElement => {
  const badge = useAllowlistStatus(policy)

  return <PolicyStatusCell chip={{ badge }} detail={badge.tooltip} />
}

export default AllowlistStatusCell
