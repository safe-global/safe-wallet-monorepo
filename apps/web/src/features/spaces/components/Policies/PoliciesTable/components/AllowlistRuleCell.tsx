import type { ReactElement } from 'react'
import PolicyRule from '@safe-global/views/features/spaces/components/Policies/PoliciesTable/components/PolicyRule'
import type { AllowlistRow } from '../../utils/allowlistStatus'
import { useAllowlistStatus } from '../../hooks/useAllowlistStatus'

/** The allowlist's name and recipient count, with the change it is in tagged beside them. */
const AllowlistRuleCell = ({ policy }: { policy: AllowlistRow }): ReactElement => {
  const { change, variant } = useAllowlistStatus(policy)

  return <PolicyRule policy={policy} change={change && { change, variant }} />
}

export default AllowlistRuleCell
