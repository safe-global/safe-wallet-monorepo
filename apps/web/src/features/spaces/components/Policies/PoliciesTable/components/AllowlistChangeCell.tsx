import type { ReactElement } from 'react'
import AllowlistChangeChip from '@safe-global/views/features/spaces/components/Policies/components/AllowlistChangeChip'
import type { AllowlistRow } from '../../utils/allowlistStatus'
import { useAllowlistStatus } from '../../hooks/useAllowlistStatus'

const AllowlistChangeCell = ({ policy }: { policy: AllowlistRow }): ReactElement | null => {
  const { change, variant } = useAllowlistStatus(policy)

  return change ? <AllowlistChangeChip change={change} variant={variant} /> : null
}

export default AllowlistChangeCell
