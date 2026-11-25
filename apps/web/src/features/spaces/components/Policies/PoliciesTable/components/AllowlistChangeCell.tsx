import type { ReactElement } from 'react'
import AllowlistChangeChip from '@safe-global/views/features/spaces/components/Policies/components/AllowlistChangeChip'
import { getAllowlistStatus, type AllowlistRow } from '../../utils/allowlistStatus'

const AllowlistChangeCell = ({ policy }: { policy: AllowlistRow }): ReactElement | null => {
  const { change, variant } = getAllowlistStatus(policy, Date.now())

  return change ? <AllowlistChangeChip change={change} variant={variant} /> : null
}

export default AllowlistChangeCell
