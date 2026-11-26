import { skipToken } from '@reduxjs/toolkit/query'
import { useGetSafeOverviewQuery } from '@/store/api/gateway'
import type { AllowlistStatusBadge } from '@safe-global/views/features/spaces/components/Policies/allowlistStatus'
import { getAllowlistStatus, type AllowlistRow } from '../utils/allowlistStatus'
import { usePoliciesClock } from './usePoliciesClock'

/** The status the table and the allowlist panel both show for a row: one function, one clock, one threshold source. */
export const useAllowlistStatus = (policy: AllowlistRow): AllowlistStatusBadge => {
  const now = usePoliciesClock()
  // A guard removal that no transaction holds yet reads its signature count from the Safe's threshold.
  const isAwaitingGuardRemoval = policy.status === 'active' && !!policy.awaitingGuardRemoval
  const { currentData: overview } = useGetSafeOverviewQuery(
    isAwaitingGuardRemoval ? { chainId: policy.safe.chainId, safeAddress: policy.safe.address } : skipToken,
  )

  return getAllowlistStatus(policy, now, overview?.threshold)
}
