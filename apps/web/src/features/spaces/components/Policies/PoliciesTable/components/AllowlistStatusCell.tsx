import type { ReactElement } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useGetSafeOverviewQuery } from '@/store/api/gateway'
import PolicyStatusCell from '@safe-global/views/features/spaces/components/Policies/PoliciesTable/components/PolicyStatusCell'
import { getAllowlistStatus, type AllowlistRow } from '../../utils/allowlistStatus'

/** A guard removal that no transaction holds yet reads its signature count from the Safe's threshold. */
const AllowlistStatusCell = ({ policy }: { policy: AllowlistRow }): ReactElement => {
  const isAwaitingGuardRemoval = policy.status === 'active' && !!policy.awaitingGuardRemoval
  const { currentData: overview } = useGetSafeOverviewQuery(
    isAwaitingGuardRemoval ? { chainId: policy.safe.chainId, safeAddress: policy.safe.address } : skipToken,
  )
  const badge = getAllowlistStatus(policy, Date.now(), overview?.threshold)

  return <PolicyStatusCell chip={{ badge }} detail={badge.tooltip} />
}

export default AllowlistStatusCell
