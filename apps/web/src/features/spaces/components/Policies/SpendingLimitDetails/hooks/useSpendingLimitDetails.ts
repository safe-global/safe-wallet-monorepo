import { useMemo } from 'react'
import { usePolicyDetailsBase, type PolicyDetailsBase } from '../../hooks/usePolicyDetailsBase'
import type { ActiveDrawerPolicy } from '../../SpendingLimitDrawer'
import { formatLastUpdated } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/format'
import type { PendingSpendingLimitPolicy } from '@safe-global/views/features/spaces/components/Policies/types'

const ENFORCED_BY = 'Safe allowance module'

export type SpendingLimitDetailsContent = PolicyDetailsBase & {
  overview: { enforcedBy: string; lastUpdated?: string }
}

export const useSpendingLimitDetails = (
  policy: ActiveDrawerPolicy | PendingSpendingLimitPolicy,
): SpendingLimitDetailsContent => {
  const spenders = useMemo(() => policy.data.spenders.map(({ spender }) => spender), [policy.data.spenders])
  const base = usePolicyDetailsBase(policy.safe, spenders)

  const lastUpdated = policy.status === 'active' ? formatLastUpdated(policy.data.spenders) : undefined

  return {
    ...base,
    overview: { enforcedBy: ENFORCED_BY, lastUpdated },
  }
}
